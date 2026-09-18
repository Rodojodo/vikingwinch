FROM python:3.11-slim

WORKDIR /app

# Install gcc and python3-dev to compile C extensions (e.g., for asyncmy)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY . .

# Expose default port (overridden at runtime by Railway's $PORT)
EXPOSE 8000

# Run database migrations on startup, then launch Uvicorn respecting $PORT
CMD ["sh", "-c", "alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
