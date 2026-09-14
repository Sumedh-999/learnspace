from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import anthropic
import os
import re
import json
import asyncpg
from datetime import date

from db.database import get_db
import rag

router = APIRouter()
client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

MODEL = "claude-sonnet-5"


class ChatRequest(BaseModel):
    message: str
    student_id: int = 1
    history: list[dict] = []


# ── which tables a question actually needs ────────────────────────────────
ROUTES = {
    "courses": {"course", "courses", "class", "classes", "instructor", "instructors",
                "teacher", "teachers", "professor", "teaches", "teaching", "schedule",
                "enrolled", "enrolment", "faculty", "progress"},
    "assignments": {"assignment", "assignments", "due", "deadline", "deadlines",
                    "homework", "lab", "labs", "submit", "submission", "submitted",
                    "late", "overdue", "task", "tasks", "report", "points"},
    "grades": {"grade", "grades", "score", "scores", "mark", "marks", "gpa",
               "percentage", "average", "doing", "performance", "result", "results",
               "passing", "failing"},
    "quizzes": {"quiz", "quizzes", "exam", "exams", "test", "tests", "midterm",
                "final", "finals"},
    "announcements": {"announcement", "announcements", "announced", "news",
                      "notice", "update", "updates", "posted"},
    "discussions": {"discussion", "discussions", "forum", "thread", "threads",
                    "classmate", "classmates", "peers", "asking", "talking",
                    "saying", "replies"},
    "calendar": {"calendar", "week", "today", "tomorrow", "upcoming", "event",
                 "events", "when", "soon", "month", "schedule"},
}

GREETING_WORDS = {"hi", "hey", "hello", "yo", "sup", "hiya", "howdy",
                  "thanks", "thank", "ok", "okay", "cool", "nice", "great",
                  "morning", "afternoon", "evening", "bye", "goodbye"}

BROAD = {"everything", "summary", "summarise", "summarize", "overview",
         "status", "all", "anything", "catch"}


def pick_tables(question: str) -> set[str]:
    words = re.findall(r"[a-z']+", question.lower())
    bag = set(words)

    hits = {t for t, keys in ROUTES.items() if bag & keys}
    if hits:
        return {t for t in ROUTES} if bag & BROAD else hits

    # nothing matched: a short social message needs no data at all
    if len(words) <= 5 and bag & GREETING_WORDS:
        return set()

    # anything else unrecognised — send everything rather than answer blind
    return set(ROUTES)


# ── fetchers, one per table ───────────────────────────────────────────────
async def _courses(conn, _sid):
    return await conn.fetch(
        "SELECT code, name, instructor, schedule, progress FROM courses ORDER BY code"
    )


async def _assignments(conn, _sid):
    return await conn.fetch(
        "SELECT a.title, c.code, a.due_date, a.status, a.points, a.score "
        "FROM assignments a JOIN courses c ON a.course_id = c.id ORDER BY a.due_date"
    )


async def _grades(conn, sid):
    return await conn.fetch(
        "SELECT c.code, c.name, g.percentage, g.letter_grade "
        "FROM grades g JOIN courses c ON g.course_id = c.id WHERE g.student_id = $1",
        sid,
    )


async def _quizzes(conn, _sid):
    return await conn.fetch(
        "SELECT q.title, c.code, q.scheduled_date, q.duration_mins, q.status "
        "FROM quizzes q JOIN courses c ON q.course_id = c.id ORDER BY q.scheduled_date"
    )


async def _announcements(conn, _sid):
    return await conn.fetch(
        "SELECT title, body, posted_at::date AS date "
        "FROM announcements ORDER BY posted_at DESC LIMIT 5"
    )


async def _discussions(conn, _sid):
    return await conn.fetch(
        "SELECT d.author_name, d.body, d.reply_count, d.posted_at::date AS date, c.code "
        "FROM discussions d JOIN courses c ON d.course_id = c.id "
        "ORDER BY d.posted_at DESC LIMIT 10"
    )


async def _calendar(conn, _sid):
    return await conn.fetch(
        "SELECT e.title, e.event_date, e.event_type, c.code "
        "FROM calendar_events e LEFT JOIN courses c ON e.course_id = c.id "
        "ORDER BY e.event_date LIMIT 10"
    )


FETCH = {
    "courses": _courses,
    "assignments": _assignments,
    "grades": _grades,
    "quizzes": _quizzes,
    "announcements": _announcements,
    "discussions": _discussions,
    "calendar": _calendar,
}

LABEL = {
    "courses": "COURSES (code, name, instructor, schedule, progress)",
    "assignments": "ASSIGNMENTS",
    "grades": "GRADES",
    "quizzes": "QUIZZES",
    "announcements": "ANNOUNCEMENTS",
    "discussions": "DISCUSSIONS",
    "calendar": "CALENDAR",
}


def _json(rows):
    return json.dumps([dict(r) for r in rows], default=str)


async def build_context(conn, student_id: int, question: str) -> tuple[str, dict]:
    wanted = pick_tables(question)

    # always-on spine: cheap, keeps the bot oriented even on a bare greeting
    codes = await conn.fetch("SELECT code, name FROM courses ORDER BY code")
    parts = [
        f"TODAY: {date.today().strftime('%B %d, %Y')}",
        f"ENROLLED: {_json(codes)}",
    ]

    for table in sorted(wanted):
        rows = await FETCH[table](conn, student_id)
        if rows:
            parts.append(f"{LABEL[table]}: {_json(rows)}")

    # uploaded course documents
    passages = []
    try:
        passages = await rag.search(conn, question)
    except Exception as e:
        print(f"[rag] retrieval failed: {type(e).__name__}: {e}", flush=True)

    if passages:
        block = "\n\n".join(
            f'[{p["title"]}] {p["content"]}' for p in passages
        )
        parts.append("COURSE DOCUMENTS (uploaded by the student):\n" + block)

    stats = {
        "tables": sorted(wanted),
        "passages": len(passages),
        "sources": sorted({p["title"] for p in passages}),
    }
    return "\n\n".join(parts), stats


def build_system(context: str, has_docs: bool) -> str:
    doc_rule = (
        "\n- When you use COURSE DOCUMENTS, end with: Source: <document title>"
        if has_docs else ""
    )
    return f"""You are LearnBot, a student assistant in LearnSpace LMS.

RESPONSE FORMAT — follow exactly:
1. Greetings ("hi", "hello", "hey") → one short line only, no data
2. Lists → one bullet per line, format: "- **Item name** (CODE) — detail"
3. Never exceed 5 bullets; if more exist, show 5 and add "…and N more"
4. No preamble like "Based on your portal" — answer directly
5. One short closing line maximum, only if genuinely useful
6. Never repeat the same warning on multiple bullets
7. Follow-ups referring to "those", "it", "the second one" → resolve against
   what you just said; don't ask the student to repeat themselves{doc_rule}

SOURCES:
- Portal records are the tables below
- COURSE DOCUMENTS are passages from PDFs the student uploaded
- If the answer is in neither, say "That's not in your portal yet."
- Never invent a deadline, grade, instructor or policy

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


async def event_stream(message: str, context: str, history: list, stats: dict):
    async with client.messages.stream(
        model=MODEL,
        max_tokens=600,
        system=build_system(context, stats["passages"] > 0),
        messages=build_turns(message, history),
    ) as stream:
        async for text in stream.text_stream:
            yield f"data: {json.dumps({'text': text})}\n\n"
    yield f"data: {json.dumps({'stats': stats})}\n\n"
    yield "data: [DONE]\n\n"


@router.post("/stream")
async def chat_stream(req: ChatRequest, conn: asyncpg.Connection = Depends(get_db)):
    context, stats = await build_context(conn, req.student_id, req.message)
    return StreamingResponse(
        event_stream(req.message, context, req.history, stats),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
