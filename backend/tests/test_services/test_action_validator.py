from uuid import uuid4

from app.models import ActionType, ProgressType, Stance
from app.services.action_validator import ActionValidator, AgentAction


def test_normalize_reply_drops_target_agent_id() -> None:
    action = AgentAction(
        action=ActionType.reply,
        target_post_id=uuid4(),
        target_agent_id=uuid4(),
        content="I agree",
        progress_type=ProgressType.agreement,
        stance=Stance.supportive,
        confidence=0.8,
    )

    normalized = ActionValidator.normalize(action)

    assert normalized.target_post_id == action.target_post_id
    assert normalized.target_agent_id is None
    assert normalized.progress_type == ProgressType.agreement

    is_valid, error = ActionValidator.validate(normalized)
    assert is_valid is True
    assert error is None


def test_normalize_like_drops_target_agent_id_and_content() -> None:
    action = AgentAction(
        action=ActionType.like,
        target_post_id=uuid4(),
        target_agent_id=uuid4(),
        content="nice",
        progress_type=ProgressType.agreement,
        stance=Stance.neutral,
        confidence=0.6,
    )

    normalized = ActionValidator.normalize(action)

    assert normalized.target_post_id == action.target_post_id
    assert normalized.target_agent_id is None
    assert normalized.content is None
    assert normalized.progress_type is None

    is_valid, error = ActionValidator.validate(normalized)
    assert is_valid is True
    assert error is None


def test_normalize_follow_drops_post_target_and_content() -> None:
    action = AgentAction(
        action=ActionType.follow,
        target_post_id=uuid4(),
        target_agent_id=uuid4(),
        content="following",
        progress_type=ProgressType.new_question,
        stance=Stance.curious,
        confidence=0.7,
    )

    normalized = ActionValidator.normalize(action)

    assert normalized.target_post_id is None
    assert normalized.target_agent_id == action.target_agent_id
    assert normalized.content is None
    assert normalized.progress_type is None

    is_valid, error = ActionValidator.validate(normalized)
    assert is_valid is True
    assert error is None


def test_validate_post_requires_progress_type() -> None:
    action = AgentAction(
        action=ActionType.post,
        content="Here is my take",
        stance=Stance.neutral,
        confidence=0.5,
    )

    is_valid, error = ActionValidator.validate(action)

    assert is_valid is False
    assert error == "post action requires progress_type"
