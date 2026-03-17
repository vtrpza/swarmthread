import enum
from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel


class RunStatus(enum.StrEnum):
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"
    cancelled = "cancelled"


class InteractionType(enum.StrEnum):
    like = "like"
    follow = "follow"


class ActionType(enum.StrEnum):
    post = "post"
    reply = "reply"
    like = "like"
    follow = "follow"
    idle = "idle"


class Stance(enum.StrEnum):
    supportive = "supportive"
    skeptical = "skeptical"
    neutral = "neutral"
    critical = "critical"
    curious = "curious"


class LLMCallStage(enum.StrEnum):
    agent_action = "agent_action"
    final_analysis = "final_analysis"


class Run(SQLModel, table=True):
    __tablename__ = "runs"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    status: RunStatus = Field(default=RunStatus.queued)
    agent_count: int = Field(default=20)
    round_count: int = Field(default=150)
    started_at: datetime | None = Field(default=None)
    completed_at: datetime | None = Field(default=None)
    error_message: str | None = Field(default=None)
    model_name: str = Field(default="qwen/qwen-plus")
    max_total_cost_usd: float = Field(default=10.0)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class RunSeed(SQLModel, table=True):
    __tablename__ = "run_seeds"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    run_id: UUID = Field(foreign_key="runs.id", index=True)
    title: str
    brand: str
    goal: str
    content_type: str
    message: str
    cta: str
    tone: str
    audience_segments: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Agent(SQLModel, table=True):
    __tablename__ = "agents"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    run_id: UUID = Field(foreign_key="runs.id", index=True)
    handle: str = Field(index=True)
    display_name: str
    persona_name: str
    persona_description: str
    stance_bias: str
    verbosity_bias: str
    skepticism_bias: str
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Post(SQLModel, table=True):
    __tablename__ = "posts"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    run_id: UUID = Field(foreign_key="runs.id", index=True)
    author_agent_id: UUID = Field(foreign_key="agents.id", index=True)
    parent_post_id: UUID | None = Field(default=None, foreign_key="posts.id")
    root_post_id: UUID = Field(index=True)
    round_number: int = Field(index=True)
    content: str
    stance: Stance
    like_count: int = Field(default=0)
    reply_count: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Interaction(SQLModel, table=True):
    __tablename__ = "interactions"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    run_id: UUID = Field(foreign_key="runs.id", index=True)
    agent_id: UUID = Field(foreign_key="agents.id", index=True)
    interaction_type: InteractionType
    target_post_id: UUID | None = Field(default=None, foreign_key="posts.id")
    target_agent_id: UUID | None = Field(default=None, foreign_key="agents.id")
    round_number: int
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Follow(SQLModel, table=True):
    __tablename__ = "follows"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    run_id: UUID = Field(foreign_key="runs.id", index=True)
    follower_agent_id: UUID = Field(foreign_key="agents.id", index=True)
    followed_agent_id: UUID = Field(foreign_key="agents.id", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class AnalysisReport(SQLModel, table=True):
    __tablename__ = "analysis_reports"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    run_id: UUID = Field(foreign_key="runs.id", unique=True, index=True)
    predicted_engagement: float
    predicted_shareability: float
    predicted_conversion_signal: float
    predicted_trust: float
    top_positive_themes: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    top_negative_themes: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    top_objections: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    recommended_rewrite: str | None = Field(default=None)
    raw_json: dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=datetime.utcnow)


class LLMCall(SQLModel, table=True):
    __tablename__ = "llm_calls"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    run_id: UUID = Field(foreign_key="runs.id", index=True)
    agent_id: UUID | None = Field(default=None, foreign_key="agents.id")
    stage: LLMCallStage
    model_name: str
    prompt_tokens: int
    completion_tokens: int
    estimated_cost_usd: float
    latency_ms: int
    success: bool
    error_message: str | None = Field(default=None)
    created_at: datetime = Field(default_factory=datetime.utcnow)
