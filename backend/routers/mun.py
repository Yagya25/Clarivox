from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
import uuid
import google.genai as genai
import json
from config import GEMINI_API_KEY
from services.gemini_service import gemini_service

router = APIRouter(prefix="/api/mun", tags=["mun"])

# In-memory MUN sessions
active_mun_sessions: Dict[str, dict] = {}


class StartMUNRequest(BaseModel):
    country: str
    committee: Optional[str] = "General Assembly"
    topic: Optional[str] = ""
    user_name: Optional[str] = "Delegate"


class StartMUNResponse(BaseModel):
    session_id: str
    country: str
    committee: str
    topic: str
    country_brief: str
    ai_opening: str


class MUNMessageRequest(BaseModel):
    content: str


class MUNMessageResponse(BaseModel):
    ai_response: str
    question_type: str
    round_number: int


class EndMUNResponse(BaseModel):
    session_id: str
    country: str
    feedback: str
    strengths: List[str]
    improvements: List[str]
    overall_impression: str


async def generate_country_brief(country: str, committee: str, topic: str) -> str:
    topic_line = f" on the topic of '{topic}'" if topic else ""
    prompt = f"""You are a MUN (Model United Nations) expert. 
Provide a comprehensive country brief for {country} as they would present in {committee}{topic_line}.

Include:
1. Country's official position on key issues
2. Key alliances and foreign policy priorities
3. Recent relevant actions or statements
4. Suggested talking points for the delegate
5. Countries likely to be allies or adversaries in this committee

Keep it concise but informative — around 300-400 words. Format with clear sections."""

    return await gemini_service.call_llm(prompt)


async def generate_mun_opening(country: str, committee: str, topic: str, country_brief: str) -> str:
    topic_line = f" on '{topic}'" if topic else ""
    prompt = f"""You are the chair/AI moderator of a MUN committee ({committee}){topic_line}.

The delegate represents: {country}

Country Brief:
{country_brief}

Generate an engaging opening message as the committee chair welcoming the delegate and asking them to deliver their opening speech. 
Be formal, diplomatic, and set the MUN tone. Ask them to present {country}'s position on the matter.
Keep it to 2-3 sentences."""

    return await gemini_service.call_llm(prompt)


@router.post("/start", response_model=StartMUNResponse)
async def start_mun_session(request: StartMUNRequest):
    """Start a new MUN session for a given country."""
    session_id = str(uuid.uuid4())

    try:
        country_brief = await generate_country_brief(
            request.country, request.committee, request.topic
        )
        ai_opening = await generate_mun_opening(
            request.country, request.committee, request.topic, country_brief
        )
    except Exception as e:
        country_brief = f"You are representing {request.country} in {request.committee}. Research your country's position on the relevant topics."
        ai_opening = f"The committee calls upon the delegate of {request.country} to present their opening statement. The floor is yours."

    active_mun_sessions[session_id] = {
        "country": request.country,
        "committee": request.committee,
        "topic": request.topic,
        "user_name": request.user_name,
        "country_brief": country_brief,
        "transcript": [{"role": "ai", "content": ai_opening}],
        "round_number": 1
    }

    return StartMUNResponse(
        session_id=session_id,
        country=request.country,
        committee=request.committee,
        topic=request.topic or "General Debate",
        country_brief=country_brief,
        ai_opening=ai_opening
    )


@router.post("/message/{session_id}", response_model=MUNMessageResponse)
async def send_mun_message(session_id: str, request: MUNMessageRequest):
    """Send a speech/message in the MUN session."""
    if session_id not in active_mun_sessions:
        raise HTTPException(status_code=404, detail="MUN session not found")

    session = active_mun_sessions[session_id]
    session["transcript"].append({"role": "user", "content": request.content})

    history_text = "\n".join([
        f"{'DELEGATE' if m['role'] == 'user' else 'CHAIR/AI'}: {m['content']}"
        for m in session["transcript"]
    ])

    # Determine question type variety
    question_types = [
        "point_of_information",
        "follow_up_question", 
        "challenge_position",
        "request_clarification",
        "counter_argument"
    ]
    round_num = session["round_number"]
    q_type = question_types[(round_num - 1) % len(question_types)]

    prompt = f"""You are an AI moderator and combined delegate in a MUN session for committee: {session['committee']}.
Country being represented by user: {session['country']}
Topic: {session['topic'] or 'General Debate'}

Country Brief for context:
{session['country_brief']}

Full session so far:
{history_text}

Now respond as the committee chair/another delegate with a {q_type.replace('_', ' ')}. 
- Ask a probing question or make a compelling point challenging the delegate's speech
- Reference specific things they said
- Be formal, diplomatic, and use MUN terminology (yields the floor, motion to, etc.)
- Keep response to 2-3 sentences
- This is round {round_num} of the session"""

    try:
        ai_response = await gemini_service.call_llm(prompt)
    except Exception as e:
        import traceback
        traceback.print_exc()
        ai_response = f"The chair recognizes the delegate's statement. Could you elaborate further on {session['country']}'s specific policy proposals regarding this matter?"

    session["transcript"].append({"role": "ai", "content": ai_response})
    session["round_number"] += 1

    return MUNMessageResponse(
        ai_response=ai_response,
        question_type=q_type,
        round_number=session["round_number"] - 1
    )


@router.post("/end/{session_id}", response_model=EndMUNResponse)
async def end_mun_session(session_id: str):
    """End the MUN session and get feedback."""
    if session_id not in active_mun_sessions:
        raise HTTPException(status_code=404, detail="MUN session not found")

    session = active_mun_sessions[session_id]

    transcript_text = "\n".join([
        f"{'DELEGATE' if m['role'] == 'user' else 'CHAIR/AI'}: {m['content']}"
        for m in session["transcript"]
    ])

    prompt = f"""You are an expert MUN coach evaluating a delegate's performance.

Country: {session['country']}
Committee: {session['committee']}
Topic: {session['topic'] or 'General Debate'}

Full Transcript:
{transcript_text}

Provide constructive feedback. Return JSON with this EXACT structure:
{{
    "feedback": "<overall paragraph feedback>",
    "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
    "improvements": ["<improvement 1>", "<improvement 2>"],
    "overall_impression": "<one sentence summary>"
}}

Return ONLY the JSON, no other text."""

    try:
        text = await gemini_service.call_llm(prompt)
        text = text.strip()
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text[3:]
            text = text.rsplit("```", 1)[0]
        result = json.loads(text)
    except Exception:
        result = {
            "feedback": f"You represented {session['country']} admirably in this MUN session.",
            "strengths": ["Engaged with the committee", "Presented country's position", "Responded to questions"],
            "improvements": ["Study country's position in more depth", "Use more formal MUN terminology"],
            "overall_impression": "A good start to your MUN journey!"
        }

    response_data = EndMUNResponse(
        session_id=session_id,
        country=session["country"],
        **result
    )
    del active_mun_sessions[session_id]
    return response_data
