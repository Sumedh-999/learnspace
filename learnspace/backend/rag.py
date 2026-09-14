"""Retrieval helpers: chunking, embedding via Voyage, similarity search."""
import os
import re
import asyncio
from typing import Iterable

import voyageai

EMBED_MODEL = "voyage-4-lite"
EMBED_DIM = 1024          # must match vector(1024) in the chunks table
CHUNK_CHARS = 800
CHUNK_OVERLAP = 150
TOP_K = 5
MIN_SIMILARITY = 0.30     # below this, a chunk is noise

_client = None


def client() -> voyageai.Client:
    global _client
    if _client is None:
        key = os.getenv("VOYAGE_API_KEY")
        if not key:
            raise RuntimeError("VOYAGE_API_KEY is not set")
        _client = voyageai.Client(api_key=key)
    return _client


def chunk_text(text: str) -> list[str]:
    """Split on sentence boundaries, pack to ~CHUNK_CHARS with overlap."""
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    if not text:
        return []

    sentences = re.split(r"(?<=[.!?])\s+|\n{2,}", text)
    chunks, buf = [], ""

    for s in sentences:
        s = s.strip()
        if not s:
            continue
        if len(buf) + len(s) + 1 <= CHUNK_CHARS:
            buf = f"{buf} {s}".strip()
        else:
            if buf:
                chunks.append(buf)
            tail = buf[-CHUNK_OVERLAP:] if buf else ""
            buf = f"{tail} {s}".strip() if tail else s
            while len(buf) > CHUNK_CHARS:
                chunks.append(buf[:CHUNK_CHARS])
                buf = buf[CHUNK_CHARS - CHUNK_OVERLAP:]

    if buf:
        chunks.append(buf)
    return [c for c in chunks if len(c.strip()) > 40]


async def embed(texts: Iterable[str], kind: str) -> list[list[float]]:
    """kind is 'document' or 'query'. Voyage tunes the vector for each."""
    texts = list(texts)
    if not texts:
        return []

    def call(batch):
        return client().embed(
            batch,
            model=EMBED_MODEL,
            input_type=kind,
            output_dimension=EMBED_DIM,
            truncation=True,
        ).embeddings

    out: list[list[float]] = []
    for i in range(0, len(texts), 100):
        batch = texts[i:i + 100]
        out.extend(await asyncio.to_thread(call, batch))
    return out


def to_pgvector(vec: list[float]) -> str:
    """pgvector accepts a bracketed literal; avoids an extra dependency."""
    return "[" + ",".join(f"{x:.6f}" for x in vec) + "]"


async def search(conn, question: str, k: int = TOP_K) -> list[dict]:
    """Return the most similar chunks across all uploaded documents."""
    row = await conn.fetchrow("SELECT count(*) AS n FROM chunks")
    if not row or row["n"] == 0:
        return []

    vecs = await embed([question], "query")
    if not vecs:
        return []

    rows = await conn.fetch(
        """
        SELECT c.content,
               d.title,
               1 - (c.embedding <=> $1::vector) AS similarity
        FROM chunks c
        JOIN documents d ON d.id = c.document_id
        ORDER BY c.embedding <=> $1::vector
        LIMIT $2
        """,
        to_pgvector(vecs[0]),
        k,
    )
    return [dict(r) for r in rows if r["similarity"] >= MIN_SIMILARITY]
