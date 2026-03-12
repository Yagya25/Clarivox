from fastapi import APIRouter, UploadFile, File, HTTPException
from models.schemas import TranscriptionResponse
from services.whisper_service import whisper_service
import tempfile
import os

router = APIRouter(prefix="/api/voice", tags=["voice"])


@router.post("/transcribe", response_model=TranscriptionResponse)
async def transcribe_audio(audio: UploadFile = File(...)):
    """Transcribe audio to text using Whisper."""
    # Validate file type
    allowed_types = [
        "audio/webm", "audio/wav", "audio/mp3", "audio/mpeg",
        "audio/ogg", "audio/mp4", "audio/x-m4a", "video/webm"
    ]

    # Save uploaded file temporarily
    temp_path = None
    try:
        suffix = ".webm"
        if audio.filename:
            _, ext = os.path.splitext(audio.filename)
            if ext:
                suffix = ext

        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await audio.read()
            tmp.write(content)
            temp_path = tmp.name

        # Transcribe
        with open(temp_path, "rb") as audio_file:
            result = await whisper_service.transcribe(audio_file)

        return TranscriptionResponse(
            text=result["text"],
            language=result.get("language")
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

    finally:
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
