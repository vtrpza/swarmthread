from uuid import UUID

from pydantic import BaseModel, Field

from app.models import ActionType, Stance


class AgentAction(BaseModel):
    action: ActionType
    target_post_id: UUID | None = None
    target_agent_id: UUID | None = None
    content: str | None = None
    stance: Stance
    confidence: float = Field(ge=0.0, le=1.0)


class ActionValidator:
    @staticmethod
    def validate(action: AgentAction) -> tuple[bool, str | None]:
        if action.action == ActionType.post:
            if not action.content:
                return False, "post action requires content"
            if action.target_post_id or action.target_agent_id:
                return (
                    False,
                    "post action should not have target_post_id or target_agent_id",
                )

        elif action.action == ActionType.reply:
            if not action.content:
                return False, "reply action requires content"
            if not action.target_post_id:
                return False, "reply action requires target_post_id"
            if action.target_agent_id:
                return False, "reply action should not have target_agent_id"

        elif action.action == ActionType.like:
            if not action.target_post_id:
                return False, "like action requires target_post_id"
            if action.content:
                return False, "like action should not have content"
            if action.target_agent_id:
                return False, "like action should not have target_agent_id"

        elif action.action == ActionType.follow:
            if not action.target_agent_id:
                return False, "follow action requires target_agent_id"
            if action.content:
                return False, "follow action should not have content"
            if action.target_post_id:
                return False, "follow action should not have target_post_id"

        elif action.action == ActionType.idle:
            if action.content:
                return False, "idle action should not have content"
            if action.target_post_id:
                return False, "idle action should not have target_post_id"
            if action.target_agent_id:
                return False, "idle action should not have target_agent_id"

        return True, None
