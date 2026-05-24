from fastapi import APIRouter, Depends
import asyncpg
from db.database import get_db

router = APIRouter()

@router.get("/{student_id}")
async def get_grades(student_id: int, conn: asyncpg.Connection = Depends(get_db)):
    rows = await conn.fetch(
        "SELECT g.*, c.code, c.name, c.color FROM grades g JOIN courses c ON g.course_id=c.id WHERE g.student_id=$1", student_id
    )
    return [dict(r) for r in rows]
