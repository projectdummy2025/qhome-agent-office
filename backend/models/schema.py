from sqlalchemy import Column, String, Float, Integer, Enum, Text, ForeignKey, JSON, DateTime
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime
import enum

Base = declarative_base()

class ChatSession(Base):
    """Tabel untuk menyimpan sesi / riwayat chat di sidebar kiri"""
    __tablename__ = "chat_sessions"
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True, default="default-user")
    title = Column(String, nullable=False, default="Chat Baru")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relasi 1-to-many: Satu sesi memiliki banyak pesan
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")

class ChatRole(str, enum.Enum):
    user = "user"
    system = "system"

class ChatMessage(Base):
    """Tabel untuk menyimpan setiap bubble chat dan log agen"""
    __tablename__ = "chat_messages"
    id = Column(String, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("chat_sessions.id"))
    role = Column(Enum(ChatRole), default=ChatRole.user)
    
    # Isi chat (narasi akhir / input user)
    content = Column(Text, nullable=True)
    
    # Log pemikiran agen (disimpan sebagai JSONB di Postgres, TEXT di SQLite)
    agent_logs = Column(JSON, nullable=True) 
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    session = relationship("ChatSession", back_populates="messages")

class Product(Base):
    """Tabel Master Katalog Material QHome"""
    __tablename__ = "products"
    sku = Column(String, primary_key=True, index=True)
    category = Column(String, index=True)
    name = Column(String)
    base_price = Column(Float)
    coverage_m2 = Column(Float)
    desc = Column(Text, nullable=True)
