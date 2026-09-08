import os
from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from dotenv import load_dotenv

load_dotenv()

# Use environment variables
DB_USER = os.environ["DB_USER"]
DB_NAME = os.environ["DB_NAME"]
DB_HOST = os.environ["DB_HOST"]
DB_PORT = os.environ["DB_PORT"]
ENVIRONMENT = os.environ.get("ENVIRONMENT", "local")

if ENVIRONMENT == "production":
    from azure.identity import DefaultAzureCredential
    credential = DefaultAzureCredential()
    DB_PASSWORD = credential.get_token("https://ossrdbms-aad.database.windows.net/.default").token
else:
    DB_PASSWORD = os.environ["DB_PASSWORD"]

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