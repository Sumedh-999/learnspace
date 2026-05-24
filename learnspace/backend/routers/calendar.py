from fastapi import APIRouter, Depends
import asyncpg
from db.database import get_db

router = APIRouter()

@router.get("/")
async def get_events(conn: asyncpg.Connection = Depends(get_db)):
    rows = await conn.fetch(
        "SELECT e.*, c.code FROM calendar_events e LEFT JOIN courses c ON e.course_id=c.id ORDER BY e.event_date"
    )
    return [dict(r) for r in rows]
