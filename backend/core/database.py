from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.core.config import settings
from backend.models.schema import Base
import chromadb
from chromadb.config import Settings as ChromaSettings

# Relational DB
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Vector DB (Chroma Docker - Lazily initialized to prevent import crashes)
class LazyChromaClient:
    def __init__(self):
        self._client = None

    def _get_client(self):
        if self._client is None:
            self._client = chromadb.HttpClient(host=settings.CHROMA_HOST, port=settings.CHROMA_PORT)
        return self._client

    def __getattr__(self, name):
        return getattr(self._get_client(), name)

chroma_client = LazyChromaClient()

def get_chroma_collection(name="catalog_knowledge"):
    return chroma_client.get_or_create_collection(name=name)
