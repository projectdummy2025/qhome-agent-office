from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    SUMOPOD_API_KEY: str
    SUMOPOD_API_BASE: str
    SUPERVISOR_MODEL: str
    SUBAGENT_MODEL: str
    
    # API Key untuk Tools MCP (Internet Research)
    TAVILY_API_KEY: str = ""


    
    # Nilai default (fallback) jika tidak ada di .env
    DATABASE_URL: str = "postgresql://postgres:postgrespassword@localhost:5432/qhome_db"
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8080

    # Konfigurasi Pydantic untuk membaca .env
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
