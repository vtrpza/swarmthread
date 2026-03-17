from datetime import datetime
from uuid import uuid4

from app.models import ActionType, Post, ProgressType, Stance
from app.services.action_validator import AgentAction
from app.services.content_novelty import ContentNoveltyGuard


def build_post(
    *,
    author_agent_id,
    content: str,
    root_post_id=None,
    parent_post_id=None,
) -> Post:
    return Post(
        id=uuid4(),
        run_id=uuid4(),
        author_agent_id=author_agent_id,
        parent_post_id=parent_post_id,
        root_post_id=root_post_id or uuid4(),
        round_number=1,
        content=content,
        stance=Stance.neutral,
        like_count=0,
        reply_count=0,
        created_at=datetime.utcnow(),
    )


def test_rejects_draft_too_similar_to_recent_agent_content() -> None:
    agent_id = uuid4()
    previous_post = build_post(
        author_agent_id=agent_id,
        content="The positioning is too vague and needs a sharper ROI angle.",
    )
    action = AgentAction(
        action=ActionType.post,
        content="The positioning is too vague and needs a sharper ROI angle.",
        progress_type=ProgressType.counterpoint,
        stance=Stance.critical,
        confidence=0.7,
    )

    result = ContentNoveltyGuard().evaluate(
        action=action,
        agent_id=agent_id,
        posts=[previous_post],
        post_map={previous_post.id: previous_post},
        recent_actions=[],
    )

    assert result.accepted is False
    assert result.reason is not None
    assert "recent content" in result.reason


def test_rejects_same_opening_phrase_as_recent_action() -> None:
    action = AgentAction(
        action=ActionType.post,
        content="Need numbers before I buy the narrative.",
        progress_type=ProgressType.evidence_request,
        stance=Stance.skeptical,
        confidence=0.6,
    )

    result = ContentNoveltyGuard().evaluate(
        action=action,
        agent_id=uuid4(),
        posts=[],
        post_map={},
        recent_actions=[
            {
                "round": 1,
                "action": "reply",
                "progress_type": "evidence_request",
                "content_excerpt": "Need numbers before I buy any of this.",
                "opening_phrase": "need numbers before i",
                "root_post_id": None,
                "target_post_id": None,
                "note": "reply to thread",
            }
        ],
    )

    assert result.accepted is False
    assert (
        result.reason == "draft starts with the same opening phrase as a recent action"
    )


def test_rejects_repeated_progress_type_in_same_thread_without_new_angle() -> None:
    agent_id = uuid4()
    root_post = build_post(
        author_agent_id=uuid4(),
        content="We launched the campaign with a bold promise.",
    )
    target_post = build_post(
        author_agent_id=uuid4(),
        content="What proof do you have that it converts?",
        root_post_id=root_post.root_post_id,
        parent_post_id=root_post.id,
    )
    action = AgentAction(
        action=ActionType.reply,
        target_post_id=target_post.id,
        content="Can you show proof that it converts?",
        progress_type=ProgressType.evidence_request,
        stance=Stance.skeptical,
        confidence=0.8,
    )

    result = ContentNoveltyGuard().evaluate(
        action=action,
        agent_id=agent_id,
        posts=[root_post, target_post],
        post_map={root_post.id: root_post, target_post.id: target_post},
        recent_actions=[
            {
                "round": 2,
                "action": "reply",
                "progress_type": "evidence_request",
                "content_excerpt": "What proof do you have that it converts?",
                "opening_phrase": "what proof do you",
                "root_post_id": str(root_post.root_post_id),
                "target_post_id": str(target_post.id),
                "note": "reply to thread",
            }
        ],
    )

    assert result.accepted is False
    assert result.reason is not None
    assert "same progress_type" in result.reason


def test_reply_fallback_downgrades_to_like_when_post_not_liked() -> None:
    target_post_id = uuid4()
    action = AgentAction(
        action=ActionType.reply,
        target_post_id=target_post_id,
        content="I already said this.",
        progress_type=ProgressType.agreement,
        stance=Stance.supportive,
        confidence=0.4,
    )

    fallback = ContentNoveltyGuard().fallback_action(
        action=action,
        liked_post_ids=set(),
    )

    assert fallback.action == ActionType.like
    assert fallback.target_post_id == target_post_id
    assert fallback.content is None
    assert fallback.progress_type is None
