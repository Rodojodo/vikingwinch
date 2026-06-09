import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from core.database import get_db_session
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
    app.dependency_overrides[get_db_session] = lambda: db_session