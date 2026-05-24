from fastapi import APIRouter, Depends
import asyncpg
from db.database import get_db

router = APIRouter()

@router.get("/")
async def get_discussions(conn: asyncpg.Connection = Depends(get_db)):
    rows = await conn.fetch(
        "SELECT d.*, c.code FROM discussions d JOIN courses c ON d.course_id=c.id ORDER BY d.posted_at DESC"
    )
    return [dict(r) for r in rows]
