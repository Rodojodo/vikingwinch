from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

# In production, import this from a configuration module (e.g., core.config)
# DATABASE_URL = settings.DATABASE_URI
DATABASE_URL = "sqlite+aiosqlite:///./app.db"

# 1. Engine Initialization
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    # The following parameter is strictly required for SQLite to prevent thread-locking errors.
    # Remove this connect_args dictionary if deploying to PostgreSQL/MySQL.
    connect_args={"check_same_thread": False}
)

# 2. Session Factory Configuration
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    # expire_on_commit=False is mandatory for async SQLAlchemy.
    # It prevents the ORM from issuing synchronous I/O calls to refresh
    # object attributes after a commit operation.
    expire_on_commit=False,
)

# 3. FastAPI Dependency
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Injects a database session into route handlers.
    The async context manager ensures the connection is returned to the pool
    regardless of whether the HTTP request succeeds or raises an exception.
    """
    async with AsyncSessionLocal() as session:
        yield session