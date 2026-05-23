# Stage 1: Build dependencies
FROM python:3.11-slim AS builder

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install compiler tools and library development files
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy only requirements to leverage Docker cache
COPY backend/requirements.txt .

# Install dependencies into a prefix directory
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Runtime image
FROM python:3.11-slim AS runner

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    PATH=/home/appuser/.local/bin:$PATH \
    PYTHONPATH=/app

# Install runtime libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create a non-privileged user
RUN groupadd -g 10001 appuser && \
    useradd -r -u 10001 -g appuser -m -d /home/appuser appuser

# Copy installed Python packages from builder stage
COPY --from=builder /root/.local /home/appuser/.local

# Copy backend source code
COPY ./backend /app/backend

# Adjust permissions and make entrypoint executable
RUN chmod +x /app/backend/entrypoint.sh && \
    chown -R appuser:appuser /app /home/appuser

USER appuser

EXPOSE 8000

# Run with entrypoint script
ENTRYPOINT ["/app/backend/entrypoint.sh"]
