from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
import asyncpg
import io

from pypdf import PdfReader

from db.database import get_db
import rag

router = APIRouter()

MAX_BYTES = 8 * 1024 * 1024      # 8 MB
MAX_CHUNKS = 400                 # ~90 pages; keeps one upload bounded


@router.get("/")
async def list_documents(conn: asyncpg.Connection = Depends(get_db)):
    rows = await conn.fetch(
        """
        SELECT d.id, d.title, d.pages, d.uploaded_at,
               count(c.id) AS chunks
        FROM documents d
        LEFT JOIN chunks c ON c.document_id = d.id
        GROUP BY d.id
        ORDER BY d.uploaded_at DESC
        """
    )
    return [dict(r) for r in rows]


@router.post("/")
async def upload_document(
    file: UploadFile = File(...),
    conn: asyncpg.Connection = Depends(get_db),
):
    if not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported.")

    raw = await file.read()
    if len(raw) > MAX_BYTES:
        raise HTTPException(400, "That file is larger than 8 MB.")

    try:
        reader = PdfReader(io.BytesIO(raw))
        pages = [(p.extract_text() or "") for p in reader.pages]
    except Exception:
        raise HTTPException(400, "Couldn't read that PDF — it may be corrupt.")

    text = "\n\n".join(pages).strip()
    if len(text) < 200:
        raise HTTPException(
            400,
            "No readable text found. Scanned PDFs need OCR before uploading.",
        )

    chunks = rag.chunk_text(text)
    if not chunks:
        raise HTTPException(400, "Couldn't split that document into passages.")
    if len(chunks) > MAX_CHUNKS:
        chunks = chunks[:MAX_CHUNKS]

    try:
        vectors = await rag.embed(chunks, "document")
    except Exception as e:
        raise HTTPException(502, f"Embedding failed: {e}")

    title = (file.filename or "document.pdf").rsplit("/", 1)[-1][:200]

    async with conn.transaction():
        doc_id = await conn.fetchval(
            "INSERT INTO documents (title, pages) VALUES ($1, $2) RETURNING id",
            title,
            len(reader.pages),
        )
        await conn.executemany(
            "INSERT INTO chunks (document_id, idx, content, embedding) "
            "VALUES ($1, $2, $3, $4::vector)",
            [
                (doc_id, i, c, rag.to_pgvector(v))
                for i, (c, v) in enumerate(zip(chunks, vectors))
            ],
        )

    return {
        "id": doc_id,
        "title": title,
        "pages": len(reader.pages),
        "chunks": len(chunks),
    }


@router.delete("/{doc_id}")
async def delete_document(doc_id: int, conn: asyncpg.Connection = Depends(get_db)):
    deleted = await conn.fetchval(
        "DELETE FROM documents WHERE id = $1 RETURNING id", doc_id
    )
    if not deleted:
        raise HTTPException(404, "No document with that id.")
    return {"deleted": doc_id}
