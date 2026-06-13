import os
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

# Use environment variables; fall back to docker-compose defaults
DB_USER = os.getenv("DB_USER", "vgs_api")
DB_PASSWORD = os.getenv("DB_PASSWORD", "localdev_api")
DB_NAME = os.getenv("DB_NAME", "vgs_management")
DB_HOST = os.getenv("DB_HOST", "db")  # "db" = docker-compose service name
DB_PORT = os.getenv("DB_PORT", "3306")

# MySQL async dialect: asyncmy (faster) or aiomysql (more stable)
DATABASE_URL = f"mysql+asyncmy://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

engine = create_async_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    echo=False,
    pool_recycle=240,
)

SessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session