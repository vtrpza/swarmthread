from fastapi import FastAPI

from app.api import (
    agents_router,
    analysis_router,
    feed_router,
    health_router,
    runs_router,
    threads_router,
)
from app.config import settings
from app.logging import configure_logging

configure_logging()

app = FastAPI(
    title="SwarmThread",
    description="Batch simulation system for predictive analysis "
    "of marketing content impact",
    version="0.1.0",
)

app.include_router(health_router)
app.include_router(runs_router)
app.include_router(feed_router)
app.include_router(threads_router)
app.include_router(agents_router)
app.include_router(analysis_router)

_langfuse_client = None


@app.on_event("startup")
async def startup():
    global _langfuse_client
    if settings.langfuse_public_key and settings.langfuse_secret_key:
        from langfuse import Langfuse

        _langfuse_client = Langfuse(
            public_key=settings.langfuse_public_key,
            secret_key=settings.langfuse_secret_key,
            host=settings.langfuse_host,
        )


@app.on_event("shutdown")
async def shutdown():
    if _langfuse_client is not None:
        _langfuse_client.flush()
        _langfuse_client.shutdown()
