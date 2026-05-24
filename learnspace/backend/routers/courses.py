from fastapi import APIRouter, Depends
import asyncpg
from db.database import get_db

router = APIRouter()

@router.get("/")
async def get_courses(conn: asyncpg.Connection = Depends(get_db)):
    rows = await conn.fetch("SELECT * FROM courses ORDER BY code")
    return [dict(r) for r in rows]
