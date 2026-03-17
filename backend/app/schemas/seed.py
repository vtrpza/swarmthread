from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class SeedBase(BaseModel):
    title: str
    brand: str
    goal: str
    content_type: str
    message: str
    cta: str
    tone: str
    audience_segments: list[str] = []
    controversy_level: str = "low"


class SeedCreate(SeedBase):
    pass


class SeedRead(SeedBase):
    id: UUID
    run_id: UUID
    created_at: datetime
