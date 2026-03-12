import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

DEBATE_ROUNDS_DEFAULT = 5

SCORING_RUBRIC = {
    "logic": {
        "description": "Logical coherence, valid reasoning, absence of fallacies",
        "max_score": 10
    },
    "evidence": {
        "description": "Quality, relevance, and specificity of evidence and examples cited",
        "max_score": 10
    },
    "persuasiveness": {
        "description": "Rhetorical effectiveness, emotional appeal balanced with reason, clarity of expression",
        "max_score": 10
    }
}

SUGGESTED_TOPICS = [
    "Social media does more harm than good to society",
    "Artificial intelligence will replace more jobs than it creates",
    "College education is no longer worth the cost",
    "Space exploration funding should be redirected to solving Earth's problems",
    "Remote work is better than office work for productivity",
    "Nuclear energy is the best solution for climate change",
    "Standardized testing should be abolished",
    "Universal basic income is a viable economic policy",
    "Privacy is more important than national security",
    "Genetic engineering of humans should be allowed"
]
