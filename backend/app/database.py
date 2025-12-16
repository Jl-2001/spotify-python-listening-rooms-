from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import DATABASE_URL



if not DATABASE_URL:
  raise RuntimeError("DATABASE_URL is not set in .env")

engine = create_engine(DATABASE_URL, echo=True, future=True)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
  from sqlalchemy.orm import Session
  db: Session = SessionLocal()
  try:
    yield db
  finally:
    db.close()