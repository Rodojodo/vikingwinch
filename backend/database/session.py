import os
import asyncio
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from dotenv import load_dotenv

load_dotenv()

# Use environment variables with Railway MySQL fallbacks
DB_USER = os.environ.get("DB_USER") or os.environ.get("MYSQLUSER") or os.environ.get("MYSQL_USER")
DB_NAME = os.environ.get("DB_NAME") or os.environ.get("MYSQLDATABASE") or os.environ.get("MYSQL_DATABASE")
DB_HOST = os.environ.get("DB_HOST") or os.environ.get("MYSQLHOST") or os.environ.get("MYSQL_HOST")
DB_PORT = os.environ.get("DB_PORT") or os.environ.get("MYSQLPORT") or os.environ.get("MYSQL_PORT")
ENVIRONMENT = os.environ.get("ENVIRONMENT", "local")

if ENVIRONMENT == "production":
    from azure.identity import DefaultAzureCredential
    credential = DefaultAzureCredential()
    DB_PASSWORD = credential.get_token("https://ossrdbms-aad.database.windows.net/.default").token
else:
    DB_PASSWORD = os.environ.get("DB_PASSWORD") or os.environ.get("MYSQLPASSWORD") or os.environ.get("MYSQL_PASSWORD")

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
        try:
            yield session
        except asyncio.CancelledError:
            await session.rollback()
            raise
        except Exception:
            await session.rollback()
            raise
