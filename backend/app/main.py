from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from . import rooms, ws, auth, models
from .database import engine


app = FastAPI()

models.Base.metadata.create_all(bind=engine)

origins = [
  "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
  CORSMiddleware,
  allow_origins=origins,
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"]
)

app.include_router(rooms.router, prefix="/api/rooms", tags=["rooms"])
app.include_router(ws.router, tags=["websocket"])
app.include_router(auth.router, tags=["spotify"])

@app.get("/")
def root():
  return {"message": "Listening Rooms API is running"}