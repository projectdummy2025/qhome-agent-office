from sqlalchemy import Column, String, Float, Integer, Enum, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import JSONB
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
    
    # Ringkasan riwayat percakapan untuk long-term memory agent
    summary = Column(Text, nullable=True)
    
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
    
    # Log pemikiran agen (disimpan sebagai JSONB di Postgres)
    agent_logs = Column(JSONB, nullable=True) 
    
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
    # Stok gudang — dipakai oleh Inventory Administrator agent
    stock_qty = Column(Integer, default=50, nullable=False)


class EstimationKPI(Base):
    """
    P6 — KPI Tracker: Mencatat metrik performa per sesi estimasi.
    Digunakan untuk mengukur:
    - lead_time_seconds: Waktu dari submit hingga selesai (target < 30 detik)
    - agent_count: Jumlah agen yang terlibat
    - product_count: Jumlah produk yang diestimasi
    """
    __tablename__ = "estimation_kpi"
    id = Column(String, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("chat_sessions.id"), index=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    lead_time_seconds = Column(Float, nullable=True)  # KPI: target < 30 detik
    agent_count = Column(Integer, default=0)          # Jumlah agen yang di-hire
    product_count = Column(Integer, default=0)        # Jumlah produk di output
    brief_length = Column(Integer, default=0)         # Panjang brief (chars)
    pdf_generated = Column(Integer, default=0)        # 0/1 apakah PDF digenerate


class Order(Base):
    """Tabel Master Order Logistik (Ternormalisasi 3NF)"""
    __tablename__ = "orders"
    id = Column(String, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("chat_sessions.id"), nullable=True)
    user_id = Column(String, index=True, default="default-user")
    client_name = Column(String, nullable=True)
    client_role = Column(String, nullable=True)
    materials_total = Column(Float, nullable=False)
    shipping_cost = Column(Float, nullable=False)
    total_invoice = Column(Float, nullable=False)
    truck_type = Column(String, nullable=False)
    delivery_date = Column(String, nullable=False)
    distance_km = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    payment_status = Column(String, default="pending", nullable=True)

    # Relasi 1-to-many: Satu order dapat memiliki banyak item detail
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    """Tabel Detail Item Order (Menghilangkan Redundansi & Duplikasi)"""
    __tablename__ = "order_items"
    id = Column(String, primary_key=True, index=True)
    order_id = Column(String, ForeignKey("orders.id"), index=True)
    product_sku = Column(String, ForeignKey("products.sku"), index=True)
    qty = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    total = Column(Float, nullable=False)

    # Relasi back-populates
    order = relationship("Order", back_populates="items")
    product = relationship("Product")


class StockRecommendation(Base):
    """Tabel untuk menyimpan rekomendasi stok hasil riset internet Research Agent"""
    __tablename__ = "stock_recommendations"
    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, ForeignKey("chat_sessions.id"), nullable=True, index=True)
    product_name = Column(String, nullable=False)
    suggested_sku = Column(String, nullable=False)
    estimated_price = Column(Float, nullable=True)
    source_url = Column(Text, nullable=True)
    specs = Column(Text, nullable=True)
    status = Column(String, default="pending", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

