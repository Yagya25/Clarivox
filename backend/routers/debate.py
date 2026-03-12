from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from models.schemas import (
    StartDebateRequest, StartDebateResponse, 
    DebateMessage, DebateMessageRequest, DebateMessageResponse,
    EndDebateResponse, DebateRole, TopicsResponse
)
from services.gemini_service import gemini_service
from services.scoring_service import scoring_service
from config import SUGGESTED_TOPICS
import uuid
from typing import Dict, List

router = APIRouter(prefix="/api/debate", tags=["debate"])

# In-memory debate sessions (for simplicity — swap for Redis/DB in production)
active_sessions: Dict[str, dict] = {}


@router.get("/topics", response_model=TopicsResponse)
async def get_topics():
    """Get a list of suggested debate topics."""
    return TopicsResponse(topics=SUGGESTED_TOPICS)


@router.post("/start", response_model=StartDebateResponse)
async def start_debate(request: StartDebateRequest):
    """Start a new debate session."""
    session_id = str(uuid.uuid4())

    # AI takes the opposite stance
    ai_stance = "against" if request.user_stance == "for" else "for"
    ai_stance_text = f"arguing {ai_stance} the topic"

    # Generate AI's opening statement
    try:
        ai_opening = await gemini_service.generate_opening_stance(
            request.topic, ai_stance_text
        )
    except Exception as e:
        ai_opening = (
            f"I'll be arguing {ai_stance} the proposition: \"{request.topic}\". "
            "I believe this position has significant merit, and I look forward to "
            "hearing your arguments. Let's begin — present your opening case."
        )

    # Store session
    active_sessions[session_id] = {
        "topic": request.topic,
        "user_stance": request.user_stance,
        "ai_stance": ai_stance,
        "max_rounds": request.max_rounds,
        "current_round": 1,
        "transcript": [
            {
                "role": "ai",
                "content": ai_opening,
                "weaknesses": None
            }
        ]
    }

    return StartDebateResponse(
        session_id=session_id,
        topic=request.topic,
        user_stance=request.user_stance,
        ai_stance=ai_stance,
        ai_opening=ai_opening,
        max_rounds=request.max_rounds
    )


@router.post("/message/{session_id}", response_model=DebateMessageResponse)
async def send_message(session_id: str, request: DebateMessageRequest):
    """Send a message in the debate and get AI's counter-argument."""
    import traceback
    try:
        if session_id not in active_sessions:
            raise HTTPException(status_code=404, detail="Debate session not found")

        session = active_sessions[session_id]

        if session["current_round"] > session["max_rounds"]:
            raise HTTPException(status_code=400, detail="Debate has ended. Please end the session to get your score.")

        # Add user message to transcript
        session["transcript"].append({
            "role": "user",
            "content": request.content,
            "weaknesses": None
        })

        # Analyze weaknesses in user's argument
        weaknesses = await gemini_service.analyze_argument_weaknesses(request.content)

        # Generate AI counter-argument
        print('generating...')
        ai_response = await gemini_service.generate_counter_argument(
            topic=session["topic"],
            ai_stance=f"arguing {session['ai_stance']} the topic",
            debate_history=session["transcript"],
            user_argument=request.content
        )
        print('generated:', ai_response)

        # Add AI response to transcript
        session["transcript"].append({
            "role": "ai",
            "content": ai_response,
            "weaknesses": weaknesses
        })

        rounds_remaining = session["max_rounds"] - session["current_round"]
        session["current_round"] += 1

        return DebateMessageResponse(
            ai_response=ai_response,
            weaknesses=weaknesses,
            round_number=session["current_round"] - 1,
            rounds_remaining=rounds_remaining
        )
    except Exception as e:
        traceback.print_exc()
        raise


@router.post("/end/{session_id}", response_model=EndDebateResponse)
async def end_debate(session_id: str):
    """End the debate and get the final score."""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Debate session not found")

    session = active_sessions[session_id]

    # Generate score
    score = await scoring_service.score_debate(
        topic=session["topic"],
        user_stance=session["user_stance"],
        transcript=session["transcript"]
    )

    # Build transcript with DebateMessage objects
    transcript = [
        DebateMessage(
            role=DebateRole(m["role"]),
            content=m["content"],
            weaknesses=m.get("weaknesses")
        )
        for m in session["transcript"]
    ]

    # Clean up session
    response = EndDebateResponse(
        session_id=session_id,
        topic=session["topic"],
        score=score,
        transcript=transcript
    )

    del active_sessions[session_id]
    return response


@router.get("/session/{session_id}")
async def get_session(session_id: str):
    """Get current debate session state."""
    if session_id not in active_sessions:
        raise HTTPException(status_code=404, detail="Debate session not found")

    session = active_sessions[session_id]
    return {
        "session_id": session_id,
        "topic": session["topic"],
        "user_stance": session["user_stance"],
        "ai_stance": session["ai_stance"],
        "current_round": session["current_round"],
        "max_rounds": session["max_rounds"],
        "message_count": len(session["transcript"])
    }
