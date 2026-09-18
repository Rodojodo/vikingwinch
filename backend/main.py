from fastapi import FastAPI, Request, status, Depends
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import OperationalError, InterfaceError
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.middleware.cors import CORSMiddleware

from database.session import get_db
from domain.day_log.router import router as day_log_router
from domain.launch.router import router as launch_router
from domain.operator.router import router as operator_router
from domain.squadron.router import router as squadron_router
from domain.winch.router import router as winch_router


async def db_unavailable_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": "Database temporarily unavailable; retry shortly."},
        headers={"Retry-After": "5"},
    )
app = FastAPI(title="Winch Log API")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
    "https://vikingwinch.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$|^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.add_exception_handler(OperationalError, db_unavailable_handler)
app.add_exception_handler(InterfaceError, db_unavailable_handler)

@app.get("/health", tags=["meta"])
async def health(db: AsyncSession = Depends(get_db)):
    await db.execute(text("SELECT 1"))
    return {"status": "ok"}

app.include_router(day_log_router)
app.include_router(launch_router)
app.include_router(operator_router)
app.include_router(squadron_router)
app.include_router(winch_router)
