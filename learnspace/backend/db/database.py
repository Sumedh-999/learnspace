import os
import asyncpg
from typing import Optional

_pool: Optional[asyncpg.Pool] = None

async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        host = os.getenv("DB_HOST")
        _pool = await asyncpg.create_pool(
            host=host,
            port=int(os.getenv("DB_PORT", "5432")),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            database=os.getenv("DB_NAME", "postgres"),
            min_size=2,
            max_size=10,
            # SSL off only for a local Docker/laptop database; Supabase always uses SSL
            ssl=None if host in ("db", "localhost", "127.0.0.1") else "require",
        )
    return _pool

async def create_tables():
    pool = await get_pool()
    schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
    with open(schema_path) as f:
        schema = f.read()
    async with pool.acquire() as conn:
        await conn.execute(schema)

async def get_db():
    pool = await get_pool()
    async with pool.acquire() as conn:
        yield conn
