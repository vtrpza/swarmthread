from uuid import UUID

from pydantic import BaseModel

from app.models import ActionType, ProgressType, Stance


class ActionBase(BaseModel):
    action: ActionType
    target_post_id: UUID | None = None
    target_agent_id: UUID | None = None
    content: str | None = None
    progress_type: ProgressType | None = None
    stance: Stance
    confidence: float


class ActionCreate(ActionBase):
    pass


class ActionRead(ActionBase):
    pass


class ActionValidation(BaseModel):
    valid: bool
    error: str | None = None
