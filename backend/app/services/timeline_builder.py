from uuid import UUID

from pydantic import BaseModel

from app.models import Agent, Interaction, Post


class FeedItem(BaseModel):
    post_id: UUID
    author_agent_id: UUID
    author_handle: str
    author_display_name: str
    content: str
    stance: str
    like_count: int
    reply_count: int
    round_number: int
    parent_post_id: UUID | None = None
    created_at: str


class ThreadItem(BaseModel):
    post_id: UUID
    author_agent_id: UUID
    author_handle: str
    content: str
    stance: str
    like_count: int
    reply_count: int
    round_number: int
    created_at: str
    replies: list["ThreadItem"] = []


class AgentProfile(BaseModel):
    agent_id: UUID
    handle: str
    display_name: str
    persona_name: str
    persona_description: str
    stance_bias: str
    post_count: int
    reply_count: int
    like_count: int
    follow_count: int
    created_at: str


class FeedResponse(BaseModel):
    items: list[FeedItem]
    total: int


class ThreadResponse(BaseModel):
    root: ThreadItem


class AgentResponse(BaseModel):
    profile: AgentProfile
    posts: list[FeedItem]


def build_feed(posts: list[Post], agents: list[Agent]) -> FeedResponse:
    agent_map = {a.id: a for a in agents}

    items = [
        FeedItem(
            post_id=p.id,
            author_agent_id=p.author_agent_id,
            author_handle=agent_map[p.author_agent_id].handle,
            author_display_name=agent_map[p.author_agent_id].display_name,
            content=p.content,
            stance=p.stance.value,
            like_count=p.like_count,
            reply_count=p.reply_count,
            round_number=p.round_number,
            parent_post_id=p.parent_post_id,
            created_at=p.created_at.isoformat(),
        )
        for p in sorted(posts, key=lambda x: x.created_at, reverse=True)
        if p.author_agent_id in agent_map
    ]

    return FeedResponse(items=items, total=len(items))


def build_thread(
    root_post: Post, all_posts: list[Post], agents: list[Agent]
) -> ThreadResponse:
    agent_map = {a.id: a for a in agents}

    def build_item(post: Post, depth: int = 0) -> ThreadItem:
        replies = [
            build_item(p, depth + 1)
            for p in all_posts
            if p.parent_post_id == post.id and p.author_agent_id in agent_map
        ]

        return ThreadItem(
            post_id=post.id,
            author_agent_id=post.author_agent_id,
            author_handle=agent_map[post.author_agent_id].handle,
            content=post.content,
            stance=post.stance.value,
            like_count=post.like_count,
            reply_count=post.reply_count,
            round_number=post.round_number,
            created_at=post.created_at.isoformat(),
            replies=replies,
        )

    root = build_item(root_post)
    return ThreadResponse(root=root)


def build_agent_profile(
    agent: Agent, posts: list[Post], interactions: list[Interaction]
) -> AgentResponse:
    agent_posts = [p for p in posts if p.author_agent_id == agent.id]
    agent_posts_count = len([p for p in agent_posts if p.parent_post_id is None])
    agent_replies_count = len([p for p in agent_posts if p.parent_post_id is not None])
    agent_likes = len(
        [
            i
            for i in interactions
            if i.agent_id == agent.id and i.interaction_type.value == "like"
        ]
    )
    agent_follows = len(
        [
            i
            for i in interactions
            if i.agent_id == agent.id and i.interaction_type.value == "follow"
        ]
    )

    profile = AgentProfile(
        agent_id=agent.id,
        handle=agent.handle,
        display_name=agent.display_name,
        persona_name=agent.persona_name,
        persona_description=agent.persona_description,
        stance_bias=agent.stance_bias,
        post_count=agent_posts_count,
        reply_count=agent_replies_count,
        like_count=agent_likes,
        follow_count=agent_follows,
        created_at=agent.created_at.isoformat(),
    )

    feed_items = [
        FeedItem(
            post_id=p.id,
            author_agent_id=p.author_agent_id,
            author_handle=agent.handle,
            author_display_name=agent.display_name,
            content=p.content,
            stance=p.stance.value,
            like_count=p.like_count,
            reply_count=p.reply_count,
            round_number=p.round_number,
            parent_post_id=p.parent_post_id,
            created_at=p.created_at.isoformat(),
        )
        for p in sorted(agent_posts, key=lambda x: x.created_at, reverse=True)
    ]

    return AgentResponse(profile=profile, posts=feed_items)
