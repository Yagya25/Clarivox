from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum
import uuid
from datetime import datetime


class DebateRole(str, Enum):
    USER = "user"
    AI = "ai"
    SYSTEM = "system"


class DebateMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: DebateRole
    content: str
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    weaknesses: Optional[List[str]] = None  # AI-identified weaknesses in user's argument


class StartDebateRequest(BaseModel):
    topic: str
    user_stance: str  # "for" or "against"
    max_rounds: int = 5


class StartDebateResponse(BaseModel):
    session_id: str
    topic: str
    user_stance: str
    ai_stance: str
    ai_opening: str
    max_rounds: int


class DebateMessageRequest(BaseModel):
    content: str


class DebateMessageResponse(BaseModel):
    ai_response: str
    weaknesses: List[str]
    round_number: int
    rounds_remaining: int


class ScoreCategory(BaseModel):
    score: float = Field(ge=0, le=10)
    feedback: str


class DebateScore(BaseModel):
    logic: ScoreCategory
    evidence: ScoreCategory
    persuasiveness: ScoreCategory
    overall_score: float
    grade: str
    summary: str
    strengths: List[str]
    improvements: List[str]


class EndDebateResponse(BaseModel):
    session_id: str
    topic: str
    score: DebateScore
    transcript: List[DebateMessage]


class TranscriptionResponse(BaseModel):
    text: str
    language: Optional[str] = None


class TopicsResponse(BaseModel):
    topics: List[str]
