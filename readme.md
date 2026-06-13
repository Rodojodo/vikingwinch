# Viking winch log keeper. (WIP)
Digital solution to physical winch paperwork.



##### Instructions for API use:
1. `pip install -r requirements.txt`
2. `sudo systemctl enable --now docker`
3. `docker compose up -d` 

##### Visual uvicorn overview can be found using:
1. `cd backend/`
2`uvicorn main:app` _If you receive an error Code 503, wait 10 seconds then try again._
3. Go to http://127.0.0.1:8000/docs#/