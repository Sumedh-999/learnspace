from fastapi import APIRouter, Depends
import asyncpg
from db.database import get_db

router = APIRouter()

@router.get("/")
async def get_assignments(conn: asyncpg.Connection = Depends(get_db)):
    rows = await conn.fetch(
        "SELECT a.*, c.code, c.name as course_name FROM assignments a JOIN courses c ON a.course_id=c.id ORDER BY a.due_date"
    )
    return [dict(r) for r in rows]
