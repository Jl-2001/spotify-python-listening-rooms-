from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from .database import get_db
from . import models

router = APIRouter()

class RoomOut(BaseModel):
  id: str
  name: str
  host_name: str

  class Config:
    orm_mode = True

  class CreatedRoomRequest(BaseModel):
    name: str
    host_name: str


@router.get("/", response_model=List[RoomOut])
def list_rooms(db: Session = Depends(get_db)):
  rooms = db.query(models.Room).order_by(models.Room.id.desc()).all()
  return rooms

class CreateRoomRequest(BaseModel):
  name: str
  host_name: str

@router.post("/", response_model=RoomOut)
def create_room(payload: CreateRoomRequest, db: Session = Depends(get_db)):
  room = models.Room(name=payload.name, host_name=payload.host_name)
  db.add(room)
  db.commit()
  db.refresh(room)
  return room

@router.get("/{room_id}", response_model=RoomOut)
def get_room(room_id: str, db: Session = Depends(get_db)):
  room = db.query(models.Room).filter(models.Room.id == room_id).first()
  if not room:
    raise HTTPException(status_code=404, detail="Room not found")
  return room