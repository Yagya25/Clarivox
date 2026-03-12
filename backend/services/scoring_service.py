from models.schemas import DebateScore, ScoreCategory
from services.gemini_service import gemini_service
from typing import List, Dict


class ScoringService:
    async def score_debate(
        self, topic: str, user_stance: str, 
        transcript: List[Dict]
    ) -> DebateScore:
        """Score the complete debate using Gemini analysis."""
        raw_score = await gemini_service.generate_final_score(
            topic, user_stance, transcript
        )

        # Calculate grade from overall score
        overall = raw_score.get("overall_score", 5.0)
        grade = self._calculate_grade(overall)

        return DebateScore(
            logic=ScoreCategory(
                score=raw_score["logic"]["score"],
                feedback=raw_score["logic"]["feedback"]
            ),
            evidence=ScoreCategory(
                score=raw_score["evidence"]["score"],
                feedback=raw_score["evidence"]["feedback"]
            ),
            persuasiveness=ScoreCategory(
                score=raw_score["persuasiveness"]["score"],
                feedback=raw_score["persuasiveness"]["feedback"]
            ),
            overall_score=overall,
            grade=raw_score.get("grade", grade),
            summary=raw_score.get("summary", ""),
            strengths=raw_score.get("strengths", []),
            improvements=raw_score.get("improvements", [])
        )

    def _calculate_grade(self, score: float) -> str:
        if score >= 9:
            return "A+"
        elif score >= 8:
            return "A"
        elif score >= 7:
            return "B"
        elif score >= 6:
            return "C"
        elif score >= 5:
            return "D"
        else:
            return "F"


scoring_service = ScoringService()
