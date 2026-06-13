from fastapi import FastAPI, Request, status, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import OperationalError, InterfaceError
from sqlalchemy.ext.asyncio import AsyncSession

from database.session import get_db
from routers import day_log, launch, operator, squadron, winch


async def db_unavailable_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": "Database temporarily unavailable; retry shortly."},
        headers={"Retry-After": "5"},
    )
app = FastAPI(title="Winch Log API")

app.add_exception_handler(OperationalError, db_unavailable_handler)
app.add_exception_handler(InterfaceError, db_unavailable_handler)

@app.get("/health", tags=["meta"])
async def health(db: AsyncSession = Depends(get_db)):
    await db.execute(text("SELECT 1"))
    return {"status": "ok"}

app.include_router(day_log.router)
app.include_router(launch.router)
app.include_router(operator.router)
app.include_router(squadron.router)
app.include_router(winch.router)