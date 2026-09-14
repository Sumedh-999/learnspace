from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import anthropic
import os
import json
import asyncpg
from datetime import date
from db.database import get_db

router = APIRouter()
client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

MODEL = "claude-sonnet-5"


class ChatRequest(BaseModel):
    message: str
    student_id: int = 1
    history: list[dict] = []


async def build_context(conn: asyncpg.Connection, student_id: int) -> str:
    assignments = await conn.fetch(
        "SELECT a.title, c.code, a.due_date, a.status, a.points, a.score "
        "FROM assignments a JOIN courses c ON a.course_id=c.id ORDER BY a.due_date"
    )
    grades = await conn.fetch(
        "SELECT c.code, c.name, g.percentage, g.letter_grade "
        "FROM grades g JOIN courses c ON g.course_id=c.id WHERE g.student_id=$1",
        student_id
    )
    quizzes = await conn.fetch(
        "SELECT q.title, c.code, q.scheduled_date, q.duration_mins, q.status "
        "FROM quizzes q JOIN courses c ON q.course_id=c.id ORDER BY q.scheduled_date"
    )
    announcements = await conn.fetch(
        "SELECT title, body, posted_at::date AS date "
        "FROM announcements ORDER BY posted_at DESC LIMIT 5"
    )
    courses = await conn.fetch(
        "SELECT code, name, instructor, schedule, progress FROM courses ORDER BY code"
    )
    discussions = await conn.fetch(
        "SELECT d.author_name, d.body, d.reply_count, d.posted_at::date AS date, c.code "
        "FROM discussions d JOIN courses c ON d.course_id=c.id ORDER BY d.posted_at DESC"
    )
    events = await conn.fetch(
        "SELECT e.title, e.event_date, e.event_type, c.code "
        "FROM calendar_events e LEFT JOIN courses c ON e.course_id=c.id "
        "ORDER BY e.event_date LIMIT 10"
    )

    j = lambda rows: json.dumps([dict(r) for r in rows], default=str)

    return f"""
COURSES (instructors & schedule): {j(courses)}
ASSIGNMENTS: {j(assignments)}
GRADES: {j(grades)}
QUIZZES: {j(quizzes)}
ANNOUNCEMENTS: {j(announcements)}
DISCUSSIONS: {j(discussions)}
CALENDAR: {j(events)}
TODAY: {date.today().strftime('%B %d, %Y')}
"""


def build_system(context: str) -> str:
    return f"""You are LearnBot, a student assistant in LearnSpace LMS.

RESPONSE FORMAT — follow exactly:
1. Greetings ("hi", "hello", "hey") → one short line only, no data
2. Lists → one bullet per line, format: "- **Item name** (CODE) — detail"
3. Never exceed 5 bullets; if more exist, show 5 and add "…and N more"
4. No preamble like "Based on your portal" — answer directly
5. One short closing line maximum, only if genuinely useful
6. Never repeat the same warning on multiple bullets
7. Follow-ups referring to "those", "it", "the second one" → resolve against
   what you just said; don't ask the student to repeat themselves

DATA ROUTING:
- Instructors → COURSES
- Discussions → DISCUSSIONS
- Deadlines → ASSIGNMENTS + CALENDAR
- Not in the data → "That's not in your portal yet."

STUDENT DATA:
{context}"""


def build_turns(message: str, history: list) -> list:
    turns = [
        {"role": m["role"], "content": m["content"]}
        for m in history[-6:]
        if m.get("role") in ("user", "assistant") and m.get("content")
    ]
    turns.append({"role": "user", "content": message})
    return turns


async def event_stream(message: str, context: str, history: list):
    async with client.messages.stream(
        model=MODEL,
        max_tokens=600,
        system=build_system(context),
        messages=build_turns(message, history),
    ) as stream:
        async for text in stream.text_stream:
            yield f"data: {json.dumps({'text': text})}\n\n"
    yield "data: [DONE]\n\n"


@router.post("/stream")
async def chat_stream(req: ChatRequest, conn: asyncpg.Connection = Depends(get_db)):
    context = await build_context(conn, req.student_id)
    return StreamingResponse(
        event_stream(req.message, context, req.history),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
