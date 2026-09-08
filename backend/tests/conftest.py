import pytest
import pytest_asyncio
import os

# Inject dummy environment variables for CI/CD before app imports
os.environ.setdefault("DB_USER", "test_user")
os.environ.setdefault("DB_PASSWORD", "test_pass")
os.environ.setdefault("DB_NAME", "test_db")
os.environ.setdefault("DB_HOST", "127.0.0.1")
os.environ.setdefault("DB_PORT", "3306")
os.environ.setdefault("ENVIRONMENT", "test")

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from database.session import get_db
from models.base import Base
from main import app

# 1. Define the transient in-memory SQLite engine
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestingSessionLocal = async_sessionmaker(
    bind=test_engine, class_=AsyncSession, expire_on_commit=False
)

# 2. Database schema lifecycle management
@pytest_asyncio.fixture(autouse=True)
async def setup_test_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

# 3. Session yielding fixture
@pytest_asyncio.fixture
async def db_session() -> AsyncSession:
    async with TestingSessionLocal() as session:
        yield session

# 4. FastAPI Dependency Override
@pytest.fixture(autouse=True)
def override_dependency(db_session):
    app.dependency_overrides[get_db] = lambda: db_session