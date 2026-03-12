from groq import Groq
from config import GROQ_API_KEY

client = Groq(api_key=GROQ_API_KEY)


class WhisperService:
    async def transcribe(self, audio_file) -> dict:
        """Transcribe audio to text using Groq Whisper."""
        try:
            transcription = client.audio.transcriptions.create(
                file=audio_file,
                model="whisper-large-v3-turbo",
                response_format="json",
                language="en",
                temperature=0.0
            )
            return {
                "text": transcription.text,
                "language": "en"
            }
        except Exception as e:
            raise Exception(f"Transcription failed: {str(e)}")


whisper_service = WhisperService()
