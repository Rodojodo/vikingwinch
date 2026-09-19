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

# Run database migrations with retry on startup, then exec Uvicorn with dual-stack IPv6 (::) for Railway private networking
CMD ["sh", "-c", "for i in $(seq 1 15); do alembic upgrade head && migrated=1 && break || { echo 'Waiting for database to be ready...'; sleep 2; }; done; [ \"$migrated\" = 1 ] && exec uvicorn main:app --host \"::\" --port ${PORT:-8000} --workers 2"]
