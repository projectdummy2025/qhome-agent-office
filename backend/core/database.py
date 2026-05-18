from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.core.config import settings
from backend.models.schema import Base
import chromadb
from chromadb.config import Settings as ChromaSettings

# Relational DB
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Vector DB (Chroma Docker)
chroma_client = chromadb.HttpClient(host=settings.CHROMA_HOST, port=settings.CHROMA_PORT)

def get_chroma_collection(name="catalog_knowledge"):
    return chroma_client.get_or_create_collection(name=name)
