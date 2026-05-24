from fastapi import APIRouter, Depends
import asyncpg
from db.database import get_db

router = APIRouter()

@router.get("/")
async def get_quizzes(conn: asyncpg.Connection = Depends(get_db)):
    rows = await conn.fetch(
        "SELECT q.*, c.code FROM quizzes q JOIN courses c ON q.course_id=c.id ORDER BY q.scheduled_date"
    )
    return [dict(r) for r in rows]
