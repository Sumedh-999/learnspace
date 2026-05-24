import os
import asyncpg
from typing import Optional

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://learnspace:learnspace@localhost:5432/learnspace")

_pool: Optional[asyncpg.Pool] = None

async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(DATABASE_URL, min_size=2, max_size=10)
    return _pool

async def create_tables():
    pool = await get_pool()
    with open("db/schema.sql") as f:
        schema = f.read()
    async with pool.acquire() as conn:
        await conn.execute(schema)

async def get_db():
    pool = await get_pool()
    async with pool.acquire() as conn:
        yield conn
