from datetime import datetime
from typing import Literal
from typing import Any
from uuid import UUID

from pydantic import BaseModel

from app.models import RunStatus


class RunBase(BaseModel):
    title: str | None = None
    brand: str
    goal: str
    content_type: str | None = None
    message: str
    cta: str | None = None
    tone: str | None = None
    audience_segments: list[str] | None = None
    simulation_preset: Literal["quick", "standard", "deep"] = "standard"
    agent_count: int | None = None
    round_count: int | None = None
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
    title: str
    brand: str
    goal: str
    audience_segments: list[str] = []


class RunList(BaseModel):
    runs: list[RunRead]
    total: int


class AgentExport(BaseModel):
    id: UUID
    handle: str
    display_name: str
    persona_name: str
    persona_description: str
    stance_bias: str
    verbosity_bias: str
    skepticism_bias: str
    created_at: datetime


class PostExport(BaseModel):
    id: UUID
    author_agent_id: UUID
    author_handle: str
    parent_post_id: UUID | None
    root_post_id: UUID
    round_number: int
    content: str
    stance: str
    like_count: int
    reply_count: int
    created_at: datetime


class InteractionExport(BaseModel):
    id: UUID
    agent_id: UUID
    agent_handle: str
    interaction_type: str
    target_post_id: UUID | None
    target_agent_id: UUID | None
    round_number: int
    created_at: datetime


class AnalysisReportExport(BaseModel):
    predicted_engagement: float
    predicted_shareability: float
    predicted_conversion_signal: float
    predicted_trust: float
    overall_recommendation: str
    confidence_label: str
    best_fit_segments: list[str]
    risky_segments: list[str]
    segment_reactions: list[dict[str, Any]]
    top_positive_themes: list[str]
    top_negative_themes: list[str]
    top_objections: list[str]
    recommended_rewrite: str | None
    created_at: datetime


class RunExport(BaseModel):
    run: RunRead
    seed: dict[str, Any]
    agents: list[AgentExport]
    posts: list[PostExport]
    interactions: list[InteractionExport]
    analysis_report: AnalysisReportExport | None = None
