from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import anthropic
import os
import json
import asyncpg
from db.database import get_db

router = APIRouter()
client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

class ChatRequest(BaseModel):
    message: str
    student_id: int = 1

async def build_context(conn: asyncpg.Connection, student_id: int) -> str:
    assignments = await conn.fetch(
        "SELECT a.title, c.code, a.due_date, a.status, a.points, a.score FROM assignments a JOIN courses c ON a.course_id=c.id ORDER BY a.due_date"
    )
    grades = await conn.fetch(
        "SELECT c.code, c.name, g.percentage, g.letter_grade FROM grades g JOIN courses c ON g.course_id=c.id WHERE g.student_id=$1", student_id
    )
    quizzes = await conn.fetch(
        "SELECT q.title, c.code, q.scheduled_date, q.duration_mins, q.status FROM quizzes q JOIN courses c ON q.course_id=c.id ORDER BY q.scheduled_date"
    )
    announcements = await conn.fetch(
        "SELECT title, body, posted_at::date as date FROM announcements ORDER BY posted_at DESC LIMIT 5"
    )
    courses = await conn.fetch(
        "SELECT code, name, instructor, schedule, progress FROM courses ORDER BY code"
    )
    discussions = await conn.fetch(
        "SELECT d.author_name, d.body, d.reply_count, d.posted_at::date as date, c.code FROM discussions d JOIN courses c ON d.course_id=c.id ORDER BY d.posted_at DESC"
    )
    events = await conn.fetch(
        "SELECT e.title, e.event_date, e.event_type, c.code FROM calendar_events e LEFT JOIN courses c ON e.course_id=c.id ORDER BY e.event_date LIMIT 10"
    )

    return f"""
COURSES (instructors & schedule): {json.dumps([dict(r) for r in courses], default=str)}
ASSIGNMENTS: {json.dumps([dict(r) for r in assignments], default=str)}
GRADES: {json.dumps([dict(r) for r in grades], default=str)}
QUIZZES: {json.dumps([dict(r) for r in quizzes], default=str)}
ANNOUNCEMENTS: {json.dumps([dict(r) for r in announcements], default=str)}
DISCUSSIONS: {json.dumps([dict(r) for r in discussions], default=str)}
CALENDAR: {json.dumps([dict(r) for r in events], default=str)}
TODAY: May 26, 2026
"""

async def event_stream(message: str, context: str):
    system = f"""You are LearnBot, an AI assistant in LearnSpace LMS.

STRICT RULES:
1. "hi", "hello", "hey" → reply with ONLY one short greeting, no data
2. Only share data when explicitly asked
3. Instructors/faculty → use COURSES data
4. Discussions → use DISCUSSIONS data
5. Schedule/deadlines → use CALENDAR + ASSIGNMENTS
6. Unknown info → say "That's not in your portal yet."
7. Use bullet points for lists
8. Max 4 sentences unless listing items

STUDENT DATA:
{context}"""

    async with client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=600,
        system=system,
        messages=[{"role": "user", "content": message}]
    ) as stream:
        async for text in stream.text_stream:
            yield f"data: {json.dumps({'text': text})}\n\n"
    yield "data: [DONE]\n\n"

@router.post("/stream")
async def chat_stream(req: ChatRequest, conn: asyncpg.Connection = Depends(get_db)):
    context = await build_context(conn, req.student_id)
    return StreamingResponse(
        event_stream(req.message, context),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )

@router.post("/message")
async def chat_message(req: ChatRequest, conn: asyncpg.Connection = Depends(get_db)):
    context = await build_context(conn, req.student_id)
    resp = await client.messages.create(
        model="claude-sonnet-4-20250514", max_tokens=600,
        system=f"You are LearnBot. Answer using this student data:\n{context}",
        messages=[{"role": "user", "content": req.message}]
    )
    return {"reply": resp.content[0].text}
