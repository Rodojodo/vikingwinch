#!/usr/bin/env fish
set -l repo_root ~/PycharmProjects/vikingwinch
set -l max_wait 30
set -l waited 0

cd $repo_root
echo "Starting database and backend containers..."
docker compose up -d --remove-orphans

echo "Waiting for MySQL to accept connections..."
while test $waited -lt $max_wait
    if docker exec vgs_mysql_mock mysqladmin ping -h 127.0.0.1 --silent 2>/dev/null
        echo "MySQL is ready."
        break
    end
    sleep 1
    set waited (math $waited + 1)
end

if test $waited -ge $max_wait
    echo "MySQL did not become ready within $max_wait seconds — check 'docker logs vgs_mysql_mock'."
    exit 1
end

cd backend
echo "Applying migrations..."
uv run alembic upgrade head

echo "Starting Backend API in the background..."
uv run uvicorn main:app &
set -l backend_pid $last_pid
cd ..

echo "Backend ready at http://localhost:8000/docs"
echo "Starting Vite dev server (foreground)..."
cd vikingwinch-frontend
npm run dev

# Cleanup when script is terminated
function cleanup --on-job-exit %self
    kill $backend_pid
end
