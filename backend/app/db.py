from typing import Annotated

from fastapi import Depends
from sqlmodel import Session, create_engine

from app.config import settings


def get_database_url(url: str) -> str:
    if url.startswith("postgresql://") and not url.startswith("postgresql+"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


engine = create_engine(
    get_database_url(settings.database_url),
    echo=settings.environment == "development",
    pool_pre_ping=True,
)


def get_session():
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_session)]
