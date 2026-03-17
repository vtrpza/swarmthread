from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class UserCreate(BaseModel):
    id: UUID | None = None


class UserRead(BaseModel):
    id: UUID
    created_at: datetime


class UserRunList(BaseModel):
    run_id: UUID
    status: str
    title: str
    brand: str
    model_name: str
    created_at: datetime
    completed_at: datetime | None = None
