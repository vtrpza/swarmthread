import asyncio
from collections import Counter, defaultdict
from datetime import datetime
from traceback import format_exc
from typing import Literal
from uuid import UUID, uuid4

from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.logging import get_logger
from app.models import (
    ActionType,
    Agent,
    AnalysisReport,
    Follow,
    Interaction,
    InteractionType,
    LLMCall,
    LLMCallStage,
    Post,
    Run,
    RunSeed,
    RunStatus,
    Stance,
)
from app.services.action_validator import ActionValidator, AgentAction
from app.services.cost_guard import CostGuard
from app.services.openrouter_client import OpenRouterClient, RateLimitError
from app.services.personas import (
    segment_for_persona_name,
    select_personas,
    generate_agent_handle,
)
from app.services.prompt_builder import (
    build_agent_action_prompt,
    build_analysis_prompt,
)

logger = get_logger(__name__)


def format_handle(handle: str) -> str:
    return handle if handle.startswith("@") else f"@{handle}"


class SegmentReaction(BaseModel):
    segment: str
    simulated_share: float = Field(ge=0.0, le=1.0)
    reaction: Literal["positive", "mixed", "negative"]
    summary: str
    key_resonators: list[str] = Field(default_factory=list)
    key_objections: list[str] = Field(default_factory=list)
    representative_posts: list[str] = Field(default_factory=list)


class AnalysisResult(BaseModel):
    predicted_engagement: float = Field(ge=0.0, le=1.0)
    predicted_shareability: float = Field(ge=0.0, le=1.0)
    predicted_conversion_signal: float = Field(ge=0.0, le=1.0)
    predicted_trust: float = Field(ge=0.0, le=1.0)
    overall_recommendation: Literal["ship", "revise", "avoid"]
    confidence_label: Literal["low", "medium", "high"]
    best_fit_segments: list[str] = Field(default_factory=list)
    risky_segments: list[str] = Field(default_factory=list)
    segment_reactions: list[SegmentReaction] = Field(default_factory=list)
    top_positive_themes: list[str] = Field(default_factory=list)
    top_negative_themes: list[str] = Field(default_factory=list)
    top_objections: list[str] = Field(default_factory=list)
    recommended_rewrite: str | None = None


class ProcessAgentResult(BaseModel):
    agent_id: UUID
    action_result: AgentAction | None = None
    metadata: dict[str, int | float] | None = None
    validation_error: str | None = None
    execution_error: str | None = None


class SimulationRunner:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.client = OpenRouterClient()
        self.validator = ActionValidator()
        self.cost_guard: CostGuard | None = None

    async def create_agents(self, run: Run, seed: RunSeed) -> list[Agent]:
        personas = select_personas(seed.audience_segments, run.agent_count)
        agents = []

        for index, persona in enumerate(personas):
            handle = generate_agent_handle(index)
            agent = Agent(
                id=uuid4(),
                run_id=run.id,
                handle=handle,
                display_name=persona["display_name"],
                persona_name=persona["name"],
                persona_description=persona["description"],
                stance_bias=persona["stance_bias"],
                verbosity_bias=persona["verbosity_bias"],
                skepticism_bias=persona["skepticism_bias"],
            )
            agents.append(agent)
            self.session.add(agent)

        await self.session.commit()
        for agent in agents:
            await self.session.refresh(agent)
        return agents

    async def create_seed_post(
        self, run: Run, agents: list[Agent], seed: RunSeed
    ) -> Post:
        brand_agent = agents[0]
        content = seed.message.strip()
        if seed.cta:
            content = f"{content}\n\n{seed.cta}"

        root_post_id = uuid4()
        post = Post(
            id=uuid4(),
            run_id=run.id,
            author_agent_id=brand_agent.id,
            parent_post_id=None,
            root_post_id=root_post_id,
            round_number=0,
            content=content,
            stance=Stance.supportive,
            like_count=0,
            reply_count=0,
        )
        self.session.add(post)
        await self.session.commit()
        await self.session.refresh(post)
        return post

    def get_agent_context(
        self,
        agent: Agent,
        round_number: int,
        posts: list[Post],
        agent_action_log: dict[UUID, list[dict[str, str | int]]],
        follow_map: dict[UUID, set[UUID]],
        agent_map: dict[UUID, Agent],
    ) -> tuple[list[dict[str, str]], list[dict[str, str | int]], list[str]]:
        recent_posts = [
            post
            for post in posts
            if post.round_number <= round_number and post.author_agent_id in agent_map
        ][-20:]

        serialized_posts = [
            {
                "post_id": str(post.id),
                "author_agent_id": str(post.author_agent_id),
                "author_handle": format_handle(agent_map[post.author_agent_id].handle),
                "content": post.content,
            }
            for post in recent_posts
        ]

        recent_actions = agent_action_log.get(agent.id, [])[-10:]
        follows = [
            format_handle(agent_map[target_id].handle)
            for target_id in sorted(follow_map.get(agent.id, set()), key=str)
            if target_id in agent_map
        ]

        return serialized_posts, recent_actions, follows

    def _record_action(
        self,
        agent_id: UUID,
        round_number: int,
        action_text: str,
        agent_action_log: dict[UUID, list[dict[str, str | int]]],
    ) -> None:
        agent_action_log[agent_id].append(
            {
                "round": round_number,
                "action": action_text,
            }
        )

    def execute_action(
        self,
        action_result: AgentAction,
        agent: Agent,
        run: Run,
        round_number: int,
        posts: list[Post],
        post_map: dict[UUID, Post],
        follow_map: dict[UUID, set[UUID]],
        agent_map: dict[UUID, Agent],
        agent_action_log: dict[UUID, list[dict[str, str | int]]],
    ) -> None:
        if action_result.action == ActionType.post:
            if action_result.content is None:
                return

            post = Post(
                id=uuid4(),
                run_id=run.id,
                author_agent_id=agent.id,
                parent_post_id=None,
                root_post_id=uuid4(),
                round_number=round_number,
                content=action_result.content,
                stance=action_result.stance,
                like_count=0,
                reply_count=0,
            )
            self.session.add(post)
            posts.append(post)
            post_map[post.id] = post
            self._record_action(
                agent.id,
                round_number,
                f"post: {action_result.content[:60]}",
                agent_action_log,
            )
            return

        if action_result.action == ActionType.reply:
            if action_result.content is None or action_result.target_post_id is None:
                return

            target_post = post_map.get(action_result.target_post_id)
            if target_post is None:
                return

            reply = Post(
                id=uuid4(),
                run_id=run.id,
                author_agent_id=agent.id,
                parent_post_id=target_post.id,
                root_post_id=target_post.root_post_id,
                round_number=round_number,
                content=action_result.content,
                stance=action_result.stance,
                like_count=0,
                reply_count=0,
            )
            target_post.reply_count += 1
            self.session.add(reply)
            posts.append(reply)
            post_map[reply.id] = reply
            self._record_action(
                agent.id,
                round_number,
                f"reply to {target_post.id}: {action_result.content[:60]}",
                agent_action_log,
            )
            return

        if action_result.action == ActionType.like:
            if action_result.target_post_id is None:
                return

            target_post = post_map.get(action_result.target_post_id)
            if target_post is None:
                return

            target_post.like_count += 1
            interaction = Interaction(
                id=uuid4(),
                run_id=run.id,
                agent_id=agent.id,
                interaction_type=InteractionType.like,
                target_post_id=target_post.id,
                target_agent_id=None,
                round_number=round_number,
            )
            self.session.add(interaction)
            self._record_action(
                agent.id,
                round_number,
                f"like post {target_post.id}",
                agent_action_log,
            )
            return

        if action_result.action == ActionType.follow:
            if action_result.target_agent_id is None:
                return

            if action_result.target_agent_id in follow_map[agent.id]:
                return

            follow_map[agent.id].add(action_result.target_agent_id)
            interaction = Interaction(
                id=uuid4(),
                run_id=run.id,
                agent_id=agent.id,
                interaction_type=InteractionType.follow,
                target_post_id=None,
                target_agent_id=action_result.target_agent_id,
                round_number=round_number,
            )
            self.session.add(interaction)

            follow = Follow(
                id=uuid4(),
                run_id=run.id,
                follower_agent_id=agent.id,
                followed_agent_id=action_result.target_agent_id,
            )
            self.session.add(follow)
            followed_agent = agent_map.get(action_result.target_agent_id)
            followed_handle = (
                format_handle(followed_agent.handle)
                if followed_agent
                else str(action_result.target_agent_id)
            )
            self._record_action(
                agent.id,
                round_number,
                f"follow {followed_handle}",
                agent_action_log,
            )
            return

        self._record_action(agent.id, round_number, "idle", agent_action_log)

    async def process_agent(
        self,
        agent: Agent,
        run: Run,
        round_num: int,
        seed: RunSeed,
        posts: list[Post],
        agent_action_log: dict[UUID, list[dict[str, str | int]]],
        follow_map: dict[UUID, set[UUID]],
        agent_map: dict[UUID, Agent],
    ) -> ProcessAgentResult:
        try:
            recent_posts, recent_actions, follows = self.get_agent_context(
                agent=agent,
                round_number=round_num,
                posts=posts,
                agent_action_log=agent_action_log,
                follow_map=follow_map,
                agent_map=agent_map,
            )

            messages = build_agent_action_prompt(
                seed=seed,
                agent=agent,
                round_number=round_num,
                total_rounds=run.round_count,
                recent_posts=recent_posts,
                recent_actions=recent_actions,
                follows=follows,
            )

            action_result, metadata = await self.client.parse(
                messages=messages,
                response_model=AgentAction,
                model=run.model_name,
                run_id=str(run.id),
                agent_id=str(agent.id),
                stage="agent_action",
            )

            is_valid, error = self.validator.validate(action_result)
            if not is_valid:
                return ProcessAgentResult(
                    agent_id=agent.id,
                    metadata=metadata,
                    validation_error=error,
                )

            return ProcessAgentResult(
                agent_id=agent.id,
                action_result=action_result,
                metadata=metadata,
            )

        except RateLimitError as error:
            logger.warning(
                "Rate limit hit for agent, will retry",
                run_id=str(run.id),
                agent_id=str(agent.id),
                error=str(error),
            )
            raise
        except Exception as error:
            logger.error(
                "Agent action failed",
                run_id=str(run.id),
                agent_id=str(agent.id),
                error=str(error),
            )
            return ProcessAgentResult(
                agent_id=agent.id,
                execution_error=str(error),
            )

    async def run_simulation(self, run: Run) -> None:
        logger.info("Starting simulation", run_id=str(run.id))

        run.status = RunStatus.running
        run.started_at = datetime.utcnow()
        self.session.add(run)
        await self.session.commit()

        self.cost_guard = CostGuard(
            max_total_cost_usd=run.max_total_cost_usd, model=run.model_name
        )

        try:
            seed_result = await self.session.execute(
                select(RunSeed).where(RunSeed.run_id == run.id)
            )
            seed = seed_result.scalar_one_or_none()
            if not seed:
                raise ValueError(f"RunSeed not found for run {run.id}")

            agents = await self.create_agents(run, seed)
            agent_map = {agent.id: agent for agent in agents}
            seed_post = await self.create_seed_post(run, agents, seed)

            all_posts = [seed_post]
            post_map = {seed_post.id: seed_post}
            follow_map: dict[UUID, set[UUID]] = defaultdict(set)
            agent_action_log: dict[UUID, list[dict[str, str | int]]] = defaultdict(list)
            self._record_action(
                seed_post.author_agent_id,
                seed_post.round_number,
                f"seed post: {seed_post.content[:60]}",
                agent_action_log,
            )

            for round_num in range(1, run.round_count + 1):
                if self.cost_guard.should_cancel():
                    run.status = RunStatus.cancelled
                    run.error_message = (
                        f"Budget exceeded: ${self.cost_guard.total_cost_usd:.4f} "
                        f">= ${run.max_total_cost_usd:.2f}"
                    )
                    run.completed_at = datetime.utcnow()
                    self.session.add(run)
                    await self.session.commit()
                    logger.warning(
                        "Simulation cancelled due to budget breach",
                        run_id=str(run.id),
                        total_cost=self.cost_guard.total_cost_usd,
                        max_budget=run.max_total_cost_usd,
                    )
                    return

                logger.info(
                    "Starting round",
                    run_id=str(run.id),
                    round_number=round_num,
                    total_rounds=run.round_count,
                )

                round_snapshot = list(all_posts)
                tasks = [
                    self.process_agent(
                        agent=agent,
                        run=run,
                        round_num=round_num,
                        seed=seed,
                        posts=round_snapshot,
                        agent_action_log=agent_action_log,
                        follow_map=follow_map,
                        agent_map=agent_map,
                    )
                    for agent in agents
                ]

                results = await asyncio.gather(*tasks, return_exceptions=True)

                for index, result in enumerate(results):
                    if isinstance(result, Exception):
                        logger.error(
                            "Agent task raised exception",
                            run_id=str(run.id),
                            agent_id=str(agents[index].id),
                            error=str(result),
                        )
                        continue

                    if result.metadata:
                        prompt_tokens = int(result.metadata.get("prompt_tokens", 0))
                        completion_tokens = int(
                            result.metadata.get("completion_tokens", 0)
                        )
                        cost = self.cost_guard.add_cost(
                            prompt_tokens,
                            completion_tokens,
                        )
                        self.session.add(
                            LLMCall(
                                id=uuid4(),
                                run_id=run.id,
                                agent_id=result.agent_id,
                                stage=LLMCallStage.agent_action,
                                model_name=run.model_name,
                                prompt_tokens=prompt_tokens,
                                completion_tokens=completion_tokens,
                                estimated_cost_usd=cost,
                                latency_ms=int(result.metadata.get("latency_ms", 0)),
                                success=result.action_result is not None,
                                error_message=(
                                    result.validation_error or result.execution_error
                                ),
                            )
                        )

                    if result.validation_error:
                        logger.warning(
                            "Invalid action",
                            run_id=str(run.id),
                            agent_id=str(result.agent_id),
                            error=result.validation_error,
                        )
                        continue

                    if result.execution_error:
                        logger.warning(
                            "Agent execution error",
                            run_id=str(run.id),
                            agent_id=str(result.agent_id),
                            error=result.execution_error,
                        )
                        continue

                    if result.action_result is None:
                        continue

                    agent = agent_map[result.agent_id]
                    self.execute_action(
                        action_result=result.action_result,
                        agent=agent,
                        run=run,
                        round_number=round_num,
                        posts=all_posts,
                        post_map=post_map,
                        follow_map=follow_map,
                        agent_map=agent_map,
                        agent_action_log=agent_action_log,
                    )

                await self.session.commit()

            run.status = RunStatus.completed
            run.completed_at = datetime.utcnow()
            self.session.add(run)
            await self.session.commit()
            logger.info("Simulation completed", run_id=str(run.id))

        except Exception as error:
            run.status = RunStatus.failed
            run.error_message = f"{error}\n\n{format_exc()}"
            run.completed_at = datetime.utcnow()
            self.session.add(run)
            await self.session.commit()
            logger.error(
                "Simulation failed",
                run_id=str(run.id),
                error=str(error),
                traceback=format_exc(),
            )
            raise

    def _build_segment_summary(
        self,
        segment: str,
        agents: list[Agent],
        posts: list[Post],
        interactions: list[Interaction],
        run: Run,
        agent_map: dict[UUID, Agent],
    ) -> dict[str, str | int | float]:
        segment_agent_ids = {
            agent.id for agent in agents if segment_for_persona_name(agent.persona_name) == segment
        }
        segment_posts = [
            post for post in posts if post.author_agent_id in segment_agent_ids
        ]
        segment_interactions = [
            interaction
            for interaction in interactions
            if interaction.agent_id in segment_agent_ids
        ]

        stance_counts = Counter(post.stance.value for post in segment_posts)
        dominant_stance = (
            stance_counts.most_common(1)[0][0] if stance_counts else "neutral"
        )
        top_posts = " | ".join(
            [
                f"{format_handle(agent_map[post.author_agent_id].handle)}: {post.content[:90]}"
                for post in sorted(
                    segment_posts,
                    key=lambda item: (item.like_count, item.reply_count),
                    reverse=True,
                )[:2]
                if post.author_agent_id in agent_map
            ]
        ) or "No standout posts"
        objections = " | ".join(
            [
                post.content[:90]
                for post in segment_posts
                if post.stance in (Stance.skeptical, Stance.critical)
            ][:2]
        ) or "No major objections observed"

        return {
            "segment": segment,
            "simulated_share": round(len(segment_agent_ids) / max(run.agent_count, 1), 2),
            "post_count": len(segment_posts),
            "like_count": sum(
                1
                for interaction in segment_interactions
                if interaction.interaction_type == InteractionType.like
            ),
            "reply_count": sum(1 for post in segment_posts if post.parent_post_id is not None),
            "follow_count": sum(
                1
                for interaction in segment_interactions
                if interaction.interaction_type == InteractionType.follow
            ),
            "dominant_stance": dominant_stance,
            "top_posts": top_posts,
            "objections": objections,
        }

    async def run_analysis(self, run: Run) -> AnalysisReport:
        seed_result = await self.session.execute(
            select(RunSeed).where(RunSeed.run_id == run.id)
        )
        seed = seed_result.scalar_one_or_none()
        if not seed:
            raise ValueError(f"RunSeed not found for run {run.id}")

        agents_result = await self.session.execute(
            select(Agent).where(Agent.run_id == run.id)
        )
        agents = list(agents_result.scalars().all())
        agent_map = {agent.id: agent for agent in agents}

        posts_result = await self.session.execute(
            select(Post).where(Post.run_id == run.id)
        )
        posts = list(posts_result.scalars().all())

        interactions_result = await self.session.execute(
            select(Interaction).where(Interaction.run_id == run.id)
        )
        interactions = list(interactions_result.scalars().all())

        total_posts = len(posts)
        total_likes = sum(
            1 for interaction in interactions if interaction.interaction_type == InteractionType.like
        )
        total_replies = sum(1 for post in posts if post.parent_post_id is not None)
        total_follows = sum(
            1
            for interaction in interactions
            if interaction.interaction_type == InteractionType.follow
        )

        segments = []
        seen_segments: set[str] = set()
        for agent in agents:
            segment = segment_for_persona_name(agent.persona_name)
            if segment not in seen_segments:
                segments.append(segment)
                seen_segments.add(segment)

        segment_summaries = [
            self._build_segment_summary(
                segment=segment,
                agents=agents,
                posts=posts,
                interactions=interactions,
                run=run,
                agent_map=agent_map,
            )
            for segment in segments
        ]

        key_posts = [
            {
                "author_handle": format_handle(agent_map[post.author_agent_id].handle),
                "segment": segment_for_persona_name(
                    agent_map[post.author_agent_id].persona_name
                ),
                "content": post.content,
            }
            for post in sorted(
                posts,
                key=lambda item: (item.like_count, item.reply_count),
                reverse=True,
            )[:20]
            if post.author_agent_id in agent_map
        ]

        messages = build_analysis_prompt(
            seed=seed,
            agent_count=len(agents),
            round_count=run.round_count,
            total_posts=total_posts,
            total_likes=total_likes,
            total_replies=total_replies,
            total_follows=total_follows,
            segment_summaries=segment_summaries,
            key_posts=key_posts,
        )

        result, metadata = await self.client.parse(
            messages=messages,
            response_model=AnalysisResult,
            model=run.model_name,
            run_id=str(run.id),
            stage="final_analysis",
        )

        cost = (
            self.cost_guard.add_cost(
                int(metadata.get("prompt_tokens", 0)),
                int(metadata.get("completion_tokens", 0)),
            )
            if self.cost_guard
            else 0.0
        )

        report = AnalysisReport(
            id=uuid4(),
            run_id=run.id,
            predicted_engagement=result.predicted_engagement,
            predicted_shareability=result.predicted_shareability,
            predicted_conversion_signal=result.predicted_conversion_signal,
            predicted_trust=result.predicted_trust,
            top_positive_themes=result.top_positive_themes,
            top_negative_themes=result.top_negative_themes,
            top_objections=result.top_objections,
            recommended_rewrite=result.recommended_rewrite,
            raw_json=result.model_dump(mode="json"),
        )
        self.session.add(report)
        await self.session.commit()
        await self.session.refresh(report)

        self.session.add(
            LLMCall(
                id=uuid4(),
                run_id=run.id,
                agent_id=None,
                stage=LLMCallStage.final_analysis,
                model_name=run.model_name,
                prompt_tokens=int(metadata.get("prompt_tokens", 0)),
                completion_tokens=int(metadata.get("completion_tokens", 0)),
                estimated_cost_usd=cost,
                latency_ms=int(metadata.get("latency_ms", 0)),
                success=True,
                error_message=None,
            )
        )
        await self.session.commit()

        return report
