# Viking winch log keeper. (WIP)
Digital solution to physical winch paperwork.



##### Instructions for API use:
1. `pip install -r backend/requirements.txt`
2. `sudo systemctl enable --now docker`
3. `docker compose up -d` 

##### Visual uvicorn overview can be found using:
1. `cd backend/`
2. `uvicorn main:app` _If you receive an error Code 503, wait 10 seconds then try again._
3. Go to http://127.0.0.1:8000/docs#/

##### Database Migrations (Alembic)
The raw `backend/database/init.sql` script is deprecated. To initialize or update your local database schema:
1. `cd backend/`
2. `uv run alembic upgrade head`
3. Optional: Run `docker exec -i vgs_mysql_mock mysql -u vgs_api -plocaldev_api vgs_management < database/seed.sql` to populate test data.

To create a new migration after modifying models:
1. `uv run alembic revision --autogenerate -m "Description of changes"`
2. `uv run alembic upgrade head`
