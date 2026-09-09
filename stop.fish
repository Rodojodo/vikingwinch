#!/usr/bin/env fish
set -l repo_root ~/PycharmProjects/vikingwinch

echo "Stopping Vite dev server if running on :5173..."
set -l vite_pid (lsof -ti :5173)
if test -n "$vite_pid"
    kill $vite_pid
    echo "Killed Vite process $vite_pid"
else
    echo "No process found on :5173"
end

echo "Stopping Uvicorn backend if running on :8000..."
set -l uvicorn_pid (lsof -ti :8000)
if test -n "$uvicorn_pid"
    kill $uvicorn_pid
    echo "Killed Uvicorn process $uvicorn_pid"
else
    echo "No process found on :8000"
end

cd $repo_root
echo "Stopping Docker services (preserving volumes)..."
docker compose down --remove-orphans

echo "Stack stopped."
