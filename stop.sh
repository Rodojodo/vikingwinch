#!/usr/bin/env bash

# Stop script for Viking Winch
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$REPO_ROOT" || exit 1

echo "Stopping database and backend containers..."
docker compose down

echo "Containers stopped."
