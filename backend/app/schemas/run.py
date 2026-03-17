from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models import RunStatus


class RunBase(BaseModel):
    title: str
    brand: str
    goal: str
    content_type: str
    message: str
    cta: str
    tone: str
    audience_segments: list[str] = []
    controversy_level: str = "low"
    agent_count: int = 20
    round_count: int = 150
    model_name: str = "qwen/qwen-plus"
    max_total_cost_usd: float = 10.0


class RunCreate(RunBase):
    pass


class RunRead(BaseModel):
    id: UUID
    status: RunStatus
    agent_count: int
    round_count: int
    model_name: str
    max_total_cost_usd: float
    created_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None
    error_message: str | None = None


class RunList(BaseModel):
    runs: list[RunRead]
    total: int
