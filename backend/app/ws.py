from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json

router = APIRouter()

class ConnectionManager:
  def __init__(self):
    self.active_connections: Dict[str, List[WebSocket]] = {}

  async def connect(self, room_id: str, websocket: WebSocket):
    print(f"[WS] connect attempt for room {room_id}")
    await websocket.accept()
    self.active_connections.setdefault(room_id, []).append(websocket)
    print(f"[WS] active in {room_id}: {len(self.active_connections[room_id])}")
  
  def disconnect(self, room_id: str, websocket: WebSocket):
    conns = self.active_connections.get(room_id)
    if not conns:
      return
    if websocket in conns:
      conns.remove(websocket)
    if not conns:
      self.active_connections.pop(room_id, None)
    print(f"[WS] disconnect from {room_id}. Remaining: {len(conns) if conns else 0}")
  
  async def broadcast(self, room_id: str, message: dict):
    data = json.dumps(message)
    for ws in self.active_connections.get(room_id, []):
      await ws.send_text(json.dumps(message))

manager = ConnectionManager()

@router.websocket("/ws/rooms/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
  print(f"[WS] New WebSocket connection for room {room_id}")
  await manager.connect(room_id, websocket)
  try: 
    while True:
      text = await websocket.receive_text()
      print(f"[WS] received from {room_id}: {text}")
      try: 
        data = json.loads(text)
      except json.JSONDecodeError:
        data = {"sender": "unknown", "text": text}
      await manager.broadcast(room_id, data)
  except WebSocketDisconnect:
    print(f"[WS] web socket disconnected for room{room_id}")
    manager.disconnect(room_id, websocket)

