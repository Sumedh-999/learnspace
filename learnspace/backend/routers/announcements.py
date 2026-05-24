from fastapi import APIRouter, Depends
import asyncpg
from db.database import get_db

router = APIRouter()

@router.get("/")
async def get_announcements(conn: asyncpg.Connection = Depends(get_db)):
    rows = await conn.fetch("SELECT * FROM announcements ORDER BY posted_at DESC")
    return [dict(r) for r in rows]
