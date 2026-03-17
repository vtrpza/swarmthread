from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings

# asyncpg doesn't support these PostgreSQL connection parameters
ASYNCPG_UNSUPPORTED_PARAMS = {
    "sslmode",
    "channel_binding",
    "gssencmode",
    "target_session_attrs",
    "sslcert",
    "sslkey",
    "sslrootcert",
    "sslcrl",
}


def get_async_database_url(url: str) -> tuple[str, bool]:
    """
    Convert database URL for asyncpg and extract SSL requirement.

    asyncpg doesn't support many PostgreSQL connection parameters in the URL,
    so we strip them out and handle SSL separately.

    Returns tuple of (url, ssl_required)
    """
    ssl_required = False

    parsed = urlparse(url)

    if parsed.query:
        params = parse_qs(parsed.query)

        # Check for ssl requirement
        if "sslmode" in params:
            sslmode = params["sslmode"][0]
            ssl_required = sslmode.lower() in ("require", "true", "1")

        # Remove unsupported parameters
        for param in ASYNCPG_UNSUPPORTED_PARAMS:
            params.pop(param, None)

        new_query = urlencode(params, doseq=True)
    else:
        new_query = parsed.query

    # Convert scheme for asyncpg
    if parsed.scheme == "postgresql" or parsed.scheme == "postgresql+psycopg":
        new_scheme = "postgresql+asyncpg"
    else:
        new_scheme = parsed.scheme

    new_url = urlunparse(
        (
            new_scheme,
            parsed.netloc,
            parsed.path,
            parsed.params,
            new_query,
            parsed.fragment,
        )
    )

    return new_url, ssl_required


_async_url, _ssl_required = get_async_database_url(settings.database_url)

# Configure connect_args for SSL if needed
connect_args = {}
if _ssl_required:
    import ssl

    connect_args["ssl"] = ssl.create_default_context()
    connect_args["ssl"].check_hostname = False
    connect_args["ssl"].verify_mode = ssl.CERT_NONE

async_engine = create_async_engine(
    _async_url,
    echo=settings.environment == "development",
    pool_size=10,
    max_overflow=20,
    connect_args=connect_args if connect_args else None,
)

AsyncSessionLocal = async_sessionmaker(
    async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


@asynccontextmanager
async def get_async_session_context():
    async with AsyncSessionLocal() as session:
        yield session
