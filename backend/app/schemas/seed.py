from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class SeedBase(BaseModel):
    title: str | None = None
    brand: str
    goal: str
    content_type: str | None = None
    message: str
    cta: str | None = None
    tone: str | None = None
    audience_segments: list[str] | None = None


class SeedCreate(SeedBase):
    pass


class SeedRead(SeedBase):
    id: UUID
    run_id: UUID
    created_at: datetime
