from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base
import datetime

class Visit(Base):
    __tablename__ = "visits"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    endpoint = Column(String, default="/")
    user_agent = Column(String, nullable=True)


class DebateSession(Base):
    __tablename__ = "debate_sessions"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    mode = Column(String, index=True)  # 'Normal', 'MUN', 'Face-to-Face'
    topic = Column(String, index=True)
    max_rounds = Column(Integer, default=5)
    winner = Column(String, nullable=True) # Could be 'user', 'ai', 'user1', 'user2', 'tie'
    overall_score = Column(Float, nullable=True)
