from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.core.database import init_db
from backend.api.routes import chat_routes

# Inisialisasi Database saat startup
init_db()

app = FastAPI(title="QHome-MAS Digital Office")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

# Registrasi Router (Modular Architecture)
app.include_router(chat_routes.router)
