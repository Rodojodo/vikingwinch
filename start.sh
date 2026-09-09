#!/usr/bin/env bash

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAX_WAIT=30
WAITED=0

cd "$REPO_ROOT" || exit 1

echo "Starting database and backend containers..."
docker compose up -d --remove-orphans

echo "Waiting for MySQL to accept connections..."
while [ $WAITED -lt $MAX_WAIT ]; do
    if docker exec vgs_mysql_mock mysqladmin ping -h 127.0.0.1 --silent 2>/dev/null; then
        echo "MySQL is ready."
        break
    fi
    sleep 1
    WAITED=$((WAITED + 1))
done

if [ $WAITED -ge $MAX_WAIT ]; then
    echo "MySQL did not become ready within $MAX_WAIT seconds — check 'docker logs vgs_mysql_mock'."
    exit 1
fi

cd backend || exit 1
echo "Applying migrations..."
uv run alembic upgrade head
cd ..

echo "Starting Backend API in the background..."
cd backend || exit 1
uv run uvicorn main:app &
BACKEND_PID=$!
cd ..

echo "Backend ready at http://localhost:8000/docs"
echo "Starting Vite dev server (foreground)..."
cd vikingwinch-frontend || exit 1
npm run dev

# Cleanup when script is terminated
trap 'kill $BACKEND_PID' EXIT
