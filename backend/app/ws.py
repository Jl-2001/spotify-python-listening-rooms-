# app/ws.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json

from .database import SessionLocal          # ⬅️ ADD THIS
from .models import Message                 # ⬅️ ADD THIS

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, room_id: str, websocket: WebSocket):
        print("[WS] connect attempt for room", room_id)
        await websocket.accept()
        self.active_connections.setdefault(room_id, []).append(websocket)
        print("[WS] active in", room_id + ":", len(self.active_connections[room_id]))

    def disconnect(self, room_id: str, websocket: WebSocket):
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)
        print("[WS] disconnect from", room_id + ". Remaining:", len(self.active_connections.get(room_id, [])))

    async def broadcast(self, room_id: str, message: dict):
        for connection in self.active_connections.get(room_id, []):
            await connection.send_text(json.dumps(message))

manager = ConnectionManager()

@router.websocket("/ws/rooms/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    print("[WS] New WebSocket connection for room", room_id)
    await manager.connect(room_id, websocket)
    print("INFO:     connection open")
    try:
        while True:
            text = await websocket.receive_text()
            data = json.loads(text)

            sender = data.get("sender") or "Anon"
            body = data.get("text") or ""

            # ⬇️ Save to DB
            db = SessionLocal()
            try:
                msg_row = Message(
                    room_id=room_id,
                    sender=sender,
                    text=body,
                )
                db.add(msg_row)
                db.commit()
                db.refresh(msg_row)

                outgoing = {
                    "id": msg_row.id,
                    "sender": msg_row.sender,
                    "text": msg_row.text,
                    "timestamp": msg_row.created_at.isoformat() if msg_row.created_at else None,
                }
                print("[WS] received from", room_id + ":", json.dumps(outgoing))
                await manager.broadcast(room_id, outgoing)
            finally:
                db.close()
    except WebSocketDisconnect:
        print("[WS] web socket disconnected for room" + room_id)
        manager.disconnect(room_id, websocket)
        print("INFO:     connection closed")
