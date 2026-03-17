from datetime import datetime
from uuid import UUID, uuid4

from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlmodel import Session

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
from app.services.openrouter_client import OpenRouterClient
from app.services.personas import PERSONA_ARCHETYPES, generate_agent_handle
from app.services.prompt_builder import (
    build_agent_action_prompt,
    build_analysis_prompt,
)

logger = get_logger(__name__)


class AnalysisResult(BaseModel):
    predicted_engagement: float = Field(ge=0.0, le=1.0)
    predicted_shareability: float = Field(ge=0.0, le=1.0)
    predicted_conversion_signal: float = Field(ge=0.0, le=1.0)
    predicted_trust: float = Field(ge=0.0, le=1.0)
    top_positive_themes: list[str] = Field(default_factory=list)
    top_negative_themes: list[str] = Field(default_factory=list)
    top_objections: list[str] = Field(default_factory=list)
    recommended_rewrite: str | None = None


class SimulationRunner:
    def __init__(self, session: Session):
        self.session = session
        self.client = OpenRouterClient()
        self.validator = ActionValidator()
        self.cost_guard: CostGuard | None = None

    def create_agents(self, run: Run) -> list[Agent]:
        agents = []
        for i in range(run.agent_count):
            persona = PERSONA_ARCHETYPES[i % len(PERSONA_ARCHETYPES)]
            handle = generate_agent_handle(i)
            agent = Agent(
                id=uuid4(),
                run_id=run.id,
                handle=f"@{handle}",
                display_name=persona["display_name"],
                persona_name=persona["name"],
                persona_description=persona["description"],
                stance_bias=persona["stance_bias"],
                verbosity_bias=persona["verbosity_bias"],
                skepticism_bias=persona["skepticism_bias"],
            )
            agents.append(agent)
            self.session.add(agent)
        self.session.commit()
        return agents

    def create_seed_post(self, run: Run, agents: list[Agent], seed: RunSeed) -> Post:
        brand_agent = agents[0]
        content = f"{seed.message}\n\n{seed.cta}"

        post = Post(
            id=uuid4(),
            run_id=run.id,
            author_agent_id=brand_agent.id,
            parent_post_id=None,
            root_post_id=uuid4(),
            round_number=0,
            content=content,
            stance=Stance.supportive,
            like_count=0,
            reply_count=0,
        )
        self.session.add(post)
        self.session.commit()
        return post

    def get_agent_context(
        self, agent: Agent, run: Run, round_number: int
    ) -> tuple[list[Post], list[dict], list[UUID]]:
        recent_posts = (
            self.session.query(Post)
            .filter(Post.run_id == run.id)
            .filter(Post.round_number <= round_number)
            .order_by(Post.created_at.desc())
            .limit(20)
            .all()
        )

        recent_actions = []
        agent_posts = (
            self.session.query(Post)
            .filter(Post.run_id == run.id)
            .filter(Post.author_agent_id == agent.id)
            .order_by(Post.created_at.desc())
            .limit(10)
            .all()
        )
        for p in agent_posts:
            recent_actions.append(
                {"round": p.round_number, "action": f"post: {p.content[:50]}..."}
            )

        follows = [
            f.followed_agent_id
            for f in self.session.query(Follow)
            .filter(Follow.run_id == run.id)
            .filter(Follow.follower_agent_id == agent.id)
            .all()
        ]

        return recent_posts, recent_actions, follows

    def execute_action(
        self,
        action_result,
        agent: Agent,
        run: Run,
        round_number: int,
        posts: list[Post],
        post_map: dict[UUID, Post],
    ) -> None:
        if action_result.action == ActionType.post:
            root_id = uuid4()
            post = Post(
                id=uuid4(),
                run_id=run.id,
                author_agent_id=agent.id,
                parent_post_id=None,
                root_post_id=root_id,
                round_number=round_number,
                content=action_result.content,
                stance=action_result.stance,
                like_count=0,
                reply_count=0,
            )
            self.session.add(post)

        elif action_result.action == ActionType.reply:
            target_post = post_map.get(action_result.target_post_id)
            if target_post:
                post = Post(
                    id=uuid4(),
                    run_id=run.id,
                    author_agent_id=agent.id,
                    parent_post_id=action_result.target_post_id,
                    root_post_id=target_post.root_post_id,
                    round_number=round_number,
                    content=action_result.content,
                    stance=action_result.stance,
                    like_count=0,
                    reply_count=0,
                )
                target_post.reply_count += 1
                self.session.add(post)

        elif action_result.action == ActionType.like:
            target_post = post_map.get(action_result.target_post_id)
            if target_post:
                target_post.like_count += 1
                interaction = Interaction(
                    id=uuid4(),
                    run_id=run.id,
                    agent_id=agent.id,
                    interaction_type=InteractionType.like,
                    target_post_id=action_result.target_post_id,
                    target_agent_id=None,
                    round_number=round_number,
                )
                self.session.add(interaction)

        elif action_result.action == ActionType.follow:
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

    def run_simulation(self, run: Run) -> None:
        logger.info("Starting simulation", run_id=str(run.id))

        run.status = RunStatus.running
        run.started_at = datetime.utcnow()
        self.session.add(run)
        self.session.commit()

        self.cost_guard = CostGuard(
            max_total_cost_usd=run.max_total_cost_usd, model=run.model_name
        )

        try:
            agents = self.create_agents(run)
            seed = self.session.exec(
                select(RunSeed).where(RunSeed.run_id == run.id)
            ).first()
            if not seed:
                raise ValueError(f"RunSeed not found for run {run.id}")
            seed_post = self.create_seed_post(run, agents, seed)

            all_posts = [seed_post]
            post_map = {seed_post.id: seed_post}

            for round_num in range(1, run.round_count + 1):
                if self.cost_guard.should_cancel():
                    run.status = RunStatus.cancelled
                    error_msg = (
                        f"Budget exceeded: ${self.cost_guard.total_cost_usd:.4f} "
                        f">= ${run.max_total_cost_usd:.2f}"
                    )
                    run.error_message = error_msg
                    run.completed_at = datetime.utcnow()
                    self.session.add(run)
                    self.session.commit()
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

                for agent in agents:
                    recent_posts, recent_actions, follows = self.get_agent_context(
                        agent, run, round_num
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

                    try:
                        action_result, metadata = self.client.parse(
                            messages=messages,
                            response_model=AgentAction,
                            model=run.model_name,
                            run_id=str(run.id),
                            agent_id=str(agent.id),
                            stage="agent_action",
                        )

                        cost = self.cost_guard.add_cost(
                            metadata.get("prompt_tokens", 0),
                            metadata.get("completion_tokens", 0),
                        )

                        llm_call = LLMCall(
                            id=uuid4(),
                            run_id=run.id,
                            agent_id=agent.id,
                            stage=LLMCallStage.agent_action,
                            model_name=run.model_name,
                            prompt_tokens=metadata.get("prompt_tokens", 0),
                            completion_tokens=metadata.get("completion_tokens", 0),
                            estimated_cost_usd=cost,
                            latency_ms=metadata.get("latency_ms", 0),
                            success=True,
                            error_message=None,
                        )
                        self.session.add(llm_call)

                        is_valid, error = self.validator.validate(action_result)
                        if is_valid:
                            self.execute_action(
                                action_result,
                                agent,
                                run,
                                round_num,
                                all_posts,
                                post_map,
                            )
                        else:
                            logger.warning(
                                "Invalid action",
                                run_id=str(run.id),
                                agent_id=str(agent.id),
                                error=error,
                            )

                    except Exception as e:
                        logger.error(
                            "Agent action failed",
                            run_id=str(run.id),
                            agent_id=str(agent.id),
                            error=str(e),
                        )

                self.session.commit()

            run.status = RunStatus.completed
            run.completed_at = datetime.utcnow()
            self.session.add(run)
            self.session.commit()

            logger.info("Simulation completed", run_id=str(run.id))

        except Exception as e:
            run.status = RunStatus.failed
            run.error_message = str(e)
            run.completed_at = datetime.utcnow()
            self.session.add(run)
            self.session.commit()
            logger.error("Simulation failed", run_id=str(run.id), error=str(e))
            raise

    def run_analysis(self, run: Run) -> AnalysisReport:
        seed = self.session.exec(
            select(RunSeed).where(RunSeed.run_id == run.id)
        ).first()
        if not seed:
            raise ValueError(f"RunSeed not found for run {run.id}")
        agents = self.session.query(Agent).filter(Agent.run_id == run.id).all()
        posts = self.session.query(Post).filter(Post.run_id == run.id).all()
        interactions = (
            self.session.query(Interaction).filter(Interaction.run_id == run.id).all()
        )

        total_posts = len(posts)
        total_likes = sum(
            1 for i in interactions if i.interaction_type == InteractionType.like
        )
        total_replies = sum(1 for p in posts if p.parent_post_id is not None)
        total_follows = sum(
            1 for i in interactions if i.interaction_type == InteractionType.follow
        )

        agent_summaries = [
            {
                "handle": a.handle,
                "persona_name": a.persona_name,
                "stance_bias": a.stance_bias,
                "post_count": sum(1 for p in posts if p.author_agent_id == a.id),
            }
            for a in agents
        ]

        key_posts = [
            {"author": a.handle, "content": p.content}
            for p in sorted(posts, key=lambda x: x.like_count, reverse=True)[:20]
            for a in agents
            if a.id == p.author_agent_id
        ]

        objection_patterns = [
            p.content[:100]
            for p in posts
            if p.stance in (Stance.skeptical, Stance.critical)
        ][:10]

        messages = build_analysis_prompt(
            seed=seed,
            agent_count=len(agents),
            round_count=run.round_count,
            total_posts=total_posts,
            total_likes=total_likes,
            total_replies=total_replies,
            total_follows=total_follows,
            agent_summaries=agent_summaries,
            key_posts=key_posts,
            objection_patterns=objection_patterns,
        )

        try:
            result, metadata = self.client.parse(
                messages=messages,
                response_model=AnalysisResult,
                model=run.model_name,
                run_id=str(run.id),
                stage="final_analysis",
            )

            cost = (
                self.cost_guard.add_cost(
                    metadata.get("prompt_tokens", 0),
                    metadata.get("completion_tokens", 0),
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
            )
            self.session.add(report)
            self.session.commit()

            llm_call = LLMCall(
                id=uuid4(),
                run_id=run.id,
                agent_id=None,
                stage=LLMCallStage.final_analysis,
                model_name=run.model_name,
                prompt_tokens=metadata.get("prompt_tokens", 0),
                completion_tokens=metadata.get("completion_tokens", 0),
                estimated_cost_usd=cost,
                latency_ms=metadata.get("latency_ms", 0),
                success=True,
                error_message=None,
            )
            self.session.add(llm_call)
            self.session.commit()

            return report

        except Exception as e:
            logger.error("Analysis failed", run_id=str(run.id), error=str(e))
            raise
