from fastapi import FastAPI

from routers import day_log, launch, operator, squadron, winch

app = FastAPI(title="Winch Log API")

app.include_router(day_log.router)
app.include_router(launch.router)
app.include_router(operator.router)
app.include_router(squadron.router)
app.include_router(winch.router)