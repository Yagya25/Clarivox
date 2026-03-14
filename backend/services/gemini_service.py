import google.genai as genai
import json
from typing import List, Dict, Optional
import traceback
from groq import Groq
from openai import OpenAI
from config import GEMINI_API_KEY, SCORING_RUBRIC, GROQ_API_KEY, OPENAI_API_KEY


# Model Configurations
GEMINI_MODEL = "gemini-1.5-flash" # Use 1.5-flash as it's more stable on some free keys
GROQ_MODEL = "llama-3.3-70b-versatile"
OPENAI_MODEL = "gpt-4o-mini"

DEBATE_SYSTEM_PROMPT = """You are an expert AI debate coach and opponent. Your role is to:
1. Take the opposing stance on the given topic
2. Present strong, well-reasoned counter-arguments
3. Identify weaknesses in the user's arguments (logical fallacies, unsupported claims, weak evidence)
4. Challenge the user to think more critically and strengthen their reasoning
5. Be firm but educational — your goal is to make the user a better debater

Rules:
- Keep responses concise (2-3 paragraphs max)
- Always address the user's specific points before adding new arguments
- Be respectful but intellectually rigorous
- Cite real-world examples and data when possible
- Never concede easily — always find a counter-angle"""

WEAKNESS_ANALYSIS_PROMPT = """Analyze the following debate argument and identify its weaknesses. 
Return a JSON array of strings, each describing a specific weakness.
Focus on: logical fallacies, unsupported claims, missing evidence, weak analogies, overgeneralizations.
Return 1-3 weaknesses. If the argument is strong, return fewer weaknesses.
Return ONLY the JSON array, no other text.

Argument: {argument}"""

SCORING_PROMPT = """You are an expert debate judge. Analyze the following debate transcript and score the USER's performance.

Topic: {topic}
User's Stance: {user_stance}

Transcript:
{transcript}

Score the USER (not the AI) on these criteria:
1. **Logic** (0-10): {logic_desc}
2. **Evidence Quality** (0-10): {evidence_desc}
3. **Persuasiveness** (0-10): {persuasiveness_desc}

Return your evaluation as a JSON object with this EXACT structure:
{{
    "logic": {{"score": <number>, "feedback": "<detailed feedback>"}},
    "evidence": {{"score": <number>, "feedback": "<detailed feedback>"}},
    "persuasiveness": {{"score": <number>, "feedback": "<detailed feedback>"}},
    "overall_score": <weighted average>,
    "grade": "<A/B/C/D/F>",
    "summary": "<overall assessment paragraph>",
    "strengths": ["<strength 1>", "<strength 2>"],
    "improvements": ["<area for improvement 1>", "<area for improvement 2>"]
}}

Be fair, constructive, and specific. Return ONLY the JSON, no other text."""


class LLMService:
    def __init__(self):
        self.gemini_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None
        self.groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None
        self.openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

    async def call_llm(self, prompt: str, system_instruction: str = "") -> str:
        """Call LLM providers with fallback: Gemini -> Groq -> OpenAI."""
        
        # 1. Try Gemini
        if self.gemini_client:
            try:
                print(f"Trying Gemini ({GEMINI_MODEL})...")
                # Combine system prompt with user prompt for simplicity across providers
                full_prompt = f"{system_instruction}\n\n{prompt}"
                response = self.gemini_client.models.generate_content(
                    model=GEMINI_MODEL, 
                    contents=full_prompt
                )
                if response and response.text:
                    return response.text
            except Exception as e:
                print(f"Gemini failed: {str(e)}")
        
        # 2. Try Groq (Llama 3.3)
        if self.groq_client:
            try:
                print(f"Falling back to Groq ({GROQ_MODEL})...")
                response = self.groq_client.chat.completions.create(
                    model=GROQ_MODEL,
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": prompt}
                    ]
                )
                if response.choices[0].message.content:
                    return response.choices[0].message.content
            except Exception as e:
                print(f"Groq failed: {str(e)}")

        # 3. Try OpenAI (GPT-4o Mini)
        if self.openai_client:
            try:
                print(f"Falling back to OpenAI ({OPENAI_MODEL})...")
                response = self.openai_client.chat.completions.create(
                    model=OPENAI_MODEL,
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": prompt}
                    ]
                )
                if response.choices[0].message.content:
                    return response.choices[0].message.content
            except Exception as e:
                print(f"OpenAI failed: {str(e)}")

        raise Exception("All LLM providers failed or are not configured.")

    async def generate_opening_stance(self, topic: str, ai_stance: str) -> str:
        """Generate AI's opening statement for the debate."""
        prompt = f"""You are debating the topic: "{topic}"
Your stance: {ai_stance}

Generate a compelling opening statement (2-3 paragraphs) presenting your position. 
Include at least one piece of evidence or real-world example."""

        return await self.call_llm(prompt, DEBATE_SYSTEM_PROMPT)

    async def generate_counter_argument(
        self, topic: str, ai_stance: str, 
        debate_history: List[Dict], user_argument: str
    ) -> str:
        """Generate a counter-argument to the user's latest point."""
        history_text = "\n".join([
            f"{'USER' if m['role'] == 'user' else 'AI'}: {m['content']}" 
            for m in debate_history
        ])

        prompt = f"""Topic: "{topic}"
Your stance: {ai_stance}

Debate so far:
{history_text}

USER's latest argument:
{user_argument}

Respond with a strong counter-argument. Address their specific points, identify any weaknesses in their reasoning, and present your counter-evidence. Keep it to 2-3 paragraphs."""

        return await self.call_llm(prompt, DEBATE_SYSTEM_PROMPT)

    async def analyze_argument_weaknesses(self, argument: str) -> List[str]:
        """Identify weaknesses in the user's argument."""
        prompt = WEAKNESS_ANALYSIS_PROMPT.format(argument=argument)

        try:
            text = await self.call_llm(prompt)
            text = text.strip()
            # Clean up potential markdown code blocks
            if text.startswith("```"):
                text = text.split("\n", 1)[1] if "\n" in text else text[3:]
                text = text.rsplit("```", 1)[0]
            weaknesses = json.loads(text)
            return weaknesses if isinstance(weaknesses, list) else []
        except (json.JSONDecodeError, Exception):
            return ["Consider strengthening your evidence for this claim."]

    async def generate_final_score(
        self, topic: str, user_stance: str, 
        transcript: List[Dict]
    ) -> Dict:
        """Generate final debate scores."""
        transcript_text = "\n".join([
            f"{'USER' if m['role'] == 'user' else 'AI'}: {m['content']}"
            for m in transcript
        ])

        prompt = SCORING_PROMPT.format(
            topic=topic,
            user_stance=user_stance,
            transcript=transcript_text,
            logic_desc=SCORING_RUBRIC["logic"]["description"],
            evidence_desc=SCORING_RUBRIC["evidence"]["description"],
            persuasiveness_desc=SCORING_RUBRIC["persuasiveness"]["description"]
        )

        try:
            text = await self.call_llm(prompt)
            text = text.strip()
            # Clean up markdown code blocks
            if text.startswith("```"):
                text = text.split("\n", 1)[1] if "\n" in text else text[3:]
                text = text.rsplit("```", 1)[0]
            return json.loads(text)
        except (json.JSONDecodeError, Exception) as e:
            return {
                "logic": {"score": 5, "feedback": "Unable to analyze. Please try again."},
                "evidence": {"score": 5, "feedback": "Unable to analyze. Please try again."},
                "persuasiveness": {"score": 5, "feedback": "Unable to analyze. Please try again."},
                "overall_score": 5.0,
                "grade": "C",
                "summary": "Scoring encountered an error. The debate was recorded successfully.",
                "strengths": ["Participated in the debate"],
                "improvements": ["Try again for a full analysis"]
            }

    async def analyze_dual_debate(self, topic: str, user1_name: str, user2_name: str, transcript_text: str) -> Dict:
        """Analyze a Face-to-Face dual user debate using LLM-based text diarization."""
        
        prompt = f"""You are an expert debate judge analyzing a Face-to-Face debate between two users who recorded into a single microphone.

Topic: "{topic}"
Player 1: {user1_name}
Player 2: {user2_name}

Raw Transcript:
{transcript_text}

First, use your reasoning to deduce which parts of the transcript were likely spoken by Player 1 and which by Player 2 based on their names and presumed opposing stances on the topic. 

Then, provide a comprehensive analysis of the debate. Return ONLY a JSON object with this EXACT structure:
{{
    "user1_review": {{
        "score": <0-100 number>,
        "strengths": ["<strength 1>", "<strength 2>"],
        "weaknesses": ["<weakness 1>", "<weakness 2>"]
    }},
    "user2_review": {{
        "score": <0-100 number>,
        "strengths": ["<strength 1>", "<strength 2>"],
        "weaknesses": ["<weakness 1>", "<weakness 2>"]
    }},
    "comparison": [
        {{ "dimension": "Argument Logic", "user1": "<short assessment>", "user2": "<short assessment>" }},
        {{ "dimension": "Evidence & Examples", "user1": "<short assessment>", "user2": "<short assessment>" }},
        {{ "dimension": "Persuasiveness", "user1": "<short assessment>", "user2": "<short assessment>" }}
    ],
    "winner": "<'user1' | 'user2' | 'tie'>",
    "overall_feedback": "<A concise paragraph summarizing the debate and explaining the verdict>"
}}

Be fair, constructive, and specific to their actual arguments. Return ONLY the JSON, no Markdown formatting like ```json."""

        try:
            text = await self.call_llm(prompt)
            text = text.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1] if "\n" in text else text[3:]
                text = text.rsplit("```", 1)[0]
            if text.startswith("json"):
                text = text[4:].strip()
            return json.loads(text)
        except Exception as e:
            print(f"Dual analysis failed: {e}")
            raise

gemini_service = LLMService()
