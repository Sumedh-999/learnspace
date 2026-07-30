from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import httpx
import os

router = APIRouter()

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID")

class TTSRequest(BaseModel):
    text: str

@router.post("/speak")
async def text_to_speech(req: TTSRequest):
    print(f"DEBUG - API Key exists: {bool(ELEVENLABS_API_KEY)}")
    print(f"DEBUG - Voice ID: {ELEVENLABS_VOICE_ID}")
    print(f"DEBUG - Text: {req.text[:50]}")

    if not ELEVENLABS_API_KEY or not ELEVENLABS_VOICE_ID:
        raise HTTPException(status_code=500, detail="ElevenLabs not configured")

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"

    headers = {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
    }

    payload = {
        "text": req.text,
        "model_id": "eleven_turbo_v2_5",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    }

    async with httpx.AsyncClient(timeout=30) as client:
        response = await client.post(url, json=payload, headers=headers)
        print(f"ElevenLabs response: {response.status_code} - {response.text[:300]}")
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"ElevenLabs error: {response.text}"
            )
        audio_content = response.content

    return StreamingResponse(
        iter([audio_content]),
        media_type="audio/mpeg",
        headers={"Content-Disposition": "inline"}
    )
