from fastapi import APIRouter, UploadFile, File, HTTPException
import httpx
import os

router = APIRouter()

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

@router.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    if not ELEVENLABS_API_KEY:
        raise HTTPException(status_code=500, detail="ElevenLabs not configured")

    audio_bytes = await audio.read()
    url = "https://api.elevenlabs.io/v1/speech-to-text"
    headers = {"xi-api-key": ELEVENLABS_API_KEY}
    files = {
        "file": (audio.filename or "audio.webm", audio_bytes, audio.content_type or "audio/webm")
    }
    data = {"model_id": "scribe_v1"}

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(url, headers=headers, files=files, data=data)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=f"STT error: {response.text}")
        result = response.json()

    return {"transcript": result.get("text", "")}
