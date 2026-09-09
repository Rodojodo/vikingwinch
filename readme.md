# 🚁 Viking Winch 

> A digital solution to modernize physical winch logkeeping.

Viking Winch is a comprehensive full-stack application designed to replace traditional paper-based winch logs. Built for reliability and ease of use, it streamlines the recording of launch data, providing real-time insights and a durable digital trail for soaring and gliding operations.

## 🏗️ Architecture & Tech Stack

Viking Winch is built with a modern, robust technology stack designed for performance and maintainability:

- **Frontend**: React, TypeScript, and Vite for a lightning-fast, responsive user interface. ⚛️
- **Backend**: FastAPI (Python) for a high-performance, asynchronous REST API. ⚡
- **Database**: MySQL, managed via SQLModel and Alembic for reliable data persistence and schema migrations. 🗄️
- **Infrastructure**: Docker for containerized database provisioning. 🐳

## 📋 Prerequisites

Ensure your development environment meets the following requirements:

- **Python**: `>=3.9` recommended 🐍
- **Node.js**: `>=18` recommended 🟢
- **Docker**: Installed and running (along with Docker Compose) 📦
- **uv**: Fast Python package installer and resolver (`curl -LsSf https://astral.sh/uv/install.sh | sh`) 🚀

## 🚀 Quick Start

We provide convenience scripts to start and stop the entire stack effortlessly.

### Using Fish Shell 🐟

```fish
./start.fish
./stop.fish
```

### Using Bash Shell 🐚

```bash
./start.sh
./stop.sh
```

## 🛠️ Manual Setup & Configuration

If you prefer to run the components manually, follow these instructions.

### 1. Environment Configuration ⚙️

Both the frontend and backend require environment variables to function correctly.

**Frontend Configuration:**
Copy the template and configure your Azure credentials (if applicable).
```bash
cd vikingwinch-frontend
cp .env.example .env
```
Ensure `VITE_AZURE_CLIENT_ID` and `VITE_AZURE_TENANT_ID` are set.

**Backend Configuration:**
Create a `.env` file in the `backend/` directory:
```env
DB_USER=vgs_api
DB_NAME=vgs_management
DB_HOST=localhost
DB_PORT=3306
DB_PASSWORD=localdev_api
ENVIRONMENT=local
```

### 2. Database Initialization 🗄️

Ensure the Docker daemon is running, then spin up the MySQL container:
```bash
sudo systemctl enable --now docker
docker compose up -d
```

### 3. Backend Setup 🐍

Initialize the database schema and start the API server:
```bash
cd backend
# Apply latest schema migrations
uv run alembic upgrade head

# Optional: Seed the database with mock data
# docker exec -i vgs_mysql_mock mysql -u vgs_api -plocaldev_api vgs_management < database/seed.sql

# Start the API server
uv run uvicorn main:app
```
*(If you encounter a `503 Service Unavailable` error, the database is still initializing. Wait 10 seconds and try again.)*

The interactive API documentation will be available at: **[http://127.0.0.1:8000/docs#/](http://127.0.0.1:8000/docs#/)**

#### Managing Database Migrations
When modifying SQLAlchemy models, generate and apply new migrations using Alembic:
```bash
cd backend
uv run alembic revision --autogenerate -m "Description of changes"
uv run alembic upgrade head
```

### 4. Frontend Setup 💻

In a new terminal window, install dependencies and start the Vite development server:
```bash
cd vikingwinch-frontend
npm install
npm run dev
```

The application will be accessible at the local URL provided by Vite (typically `http://localhost:5173`).
