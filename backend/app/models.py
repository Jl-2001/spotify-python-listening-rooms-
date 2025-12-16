from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from datetime import datetime
import uuid
from .database import Base

def generate_uuid():
  return str(uuid.uuid4())

class Room(Base):
  __tablename__ = "rooms"

  id = Column(String, primary_key=True, default=generate_uuid, index=True)
  name = Column(String, nullable=False)
  host_name = Column(String, nullable=False)

class Message(Base):
  __tablename__ = "messages"

  id = Column(String, primary_key=True, default=generate_uuid, index=True)
  room_id = Column(String, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False, index=True)
  sender = Column(String, nullable=False)
  text = Column(Text, nullable=False)
  created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)