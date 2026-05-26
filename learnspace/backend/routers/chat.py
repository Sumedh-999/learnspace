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
    return f"""ASSIGNMENTS: {json.dumps([dict(r) for r in assignments], default=str)}
GRADES: {json.dumps([dict(r) for r in grades], default=str)}
QUIZZES: {json.dumps([dict(r) for r in quizzes], default=str)}
ANNOUNCEMENTS: {json.dumps([dict(r) for r in announcements], default=str)}
TODAY: May 22, 2026"""

async def event_stream(message: str, context: str):
    system = f"""You are LearnBot, an AI assistant embedded in LearnSpace LMS.
You have FULL access to the student's academic data below. Always answer using it.
- Faculty/instructors → look in COURSES data
- Discussions → look in DISCUSSIONS data  
- Schedule/deadlines → look in CALENDAR and ASSIGNMENTS
- Never say you don't have access to something — the data is all below
- Be friendly, specific, and concise. Use bullet points for lists.
- If asked something not in the data, say "That information isn't in your portal yet."

STUDENT DATA:
{context}"""
    async with client.messages.stream(
        model="claude-sonnet-4-20250514",
        max_tokens=500,
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
        model="claude-sonnet-4-20250514", max_tokens=500,
        system=f"You are LearnBot. Answer concisely using: {context}",
        messages=[{"role": "user", "content": req.message}]
    )
    return {"reply": resp.content[0].text}
