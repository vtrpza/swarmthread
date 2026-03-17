from uuid import UUID

from fastapi import APIRouter, HTTPException
from sqlmodel import select

from app.db import SessionDep
from app.models import (
    Agent,
    AnalysisReport,
    Interaction,
    Post,
    Run,
    RunSeed,
    RunStatus,
)
from app.schemas.run import RunCreate, RunExport, RunRead

router = APIRouter(prefix="/runs", tags=["runs"])


@router.post("/", response_model=RunRead, status_code=201)
def create_run(run_create: RunCreate, session: SessionDep) -> Run:
    run = Run(
        agent_count=run_create.agent_count,
        round_count=run_create.round_count,
        model_name=run_create.model_name,
        max_total_cost_usd=run_create.max_total_cost_usd,
        status=RunStatus.queued,
    )
    session.add(run)
    session.commit()
    session.refresh(run)

    seed = RunSeed(
        run_id=run.id,
        title=run_create.title,
        brand=run_create.brand,
        goal=run_create.goal,
        content_type=run_create.content_type,
        message=run_create.message,
        cta=run_create.cta,
        tone=run_create.tone,
        audience_segments=run_create.audience_segments,
        controversy_level=run_create.controversy_level,
    )
    session.add(seed)
    session.commit()
    session.refresh(seed)

    return run


@router.get("/{run_id}", response_model=RunRead)
def get_run(run_id: UUID, session: SessionDep) -> Run:
    run = session.get(Run, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    return run


@router.post("/{run_id}/cancel", response_model=RunRead)
def cancel_run(run_id: UUID, session: SessionDep) -> Run:
    run = session.get(Run, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    if run.status not in (RunStatus.queued, RunStatus.running):
        raise HTTPException(status_code=400, detail="Run cannot be cancelled")
    run.status = RunStatus.cancelled
    session.add(run)
    session.commit()
    session.refresh(run)
    return run


@router.get("/{run_id}/export", response_model=RunExport)
def export_run(run_id: UUID, session: SessionDep) -> dict:
    run = session.get(Run, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    if run.status not in (RunStatus.completed, RunStatus.cancelled):
        raise HTTPException(
            status_code=400,
            detail="Run must be completed or cancelled to export",
        )

    seed = session.get(RunSeed, run_id)
    if not seed:
        raise HTTPException(status_code=404, detail="Run seed not found")

    agents = session.exec(select(Agent).where(Agent.run_id == run_id)).all()
    agent_map = {a.id: a for a in agents}

    posts = session.exec(select(Post).where(Post.run_id == run_id)).all()

    interactions = session.exec(
        select(Interaction).where(Interaction.run_id == run_id)
    ).all()

    analysis_report = session.exec(
        select(AnalysisReport).where(AnalysisReport.run_id == run_id)
    ).first()

    return {
        "run": RunRead.model_validate(run),
        "seed": {
            "title": seed.title,
            "brand": seed.brand,
            "goal": seed.goal,
            "content_type": seed.content_type,
            "message": seed.message,
            "cta": seed.cta,
            "tone": seed.tone,
            "audience_segments": seed.audience_segments,
            "controversy_level": seed.controversy_level,
        },
        "agents": [
            {
                "id": a.id,
                "handle": a.handle,
                "display_name": a.display_name,
                "persona_name": a.persona_name,
                "persona_description": a.persona_description,
                "stance_bias": a.stance_bias,
                "verbosity_bias": a.verbosity_bias,
                "skepticism_bias": a.skepticism_bias,
                "created_at": a.created_at,
            }
            for a in agents
        ],
        "posts": [
            {
                "id": p.id,
                "author_agent_id": p.author_agent_id,
                "author_handle": agent_map[p.author_agent_id].handle,
                "parent_post_id": p.parent_post_id,
                "root_post_id": p.root_post_id,
                "round_number": p.round_number,
                "content": p.content,
                "stance": p.stance,
                "like_count": p.like_count,
                "reply_count": p.reply_count,
                "created_at": p.created_at,
            }
            for p in posts
        ],
        "interactions": [
            {
                "id": i.id,
                "agent_id": i.agent_id,
                "agent_handle": agent_map[i.agent_id].handle,
                "interaction_type": i.interaction_type,
                "target_post_id": i.target_post_id,
                "target_agent_id": i.target_agent_id,
                "round_number": i.round_number,
                "created_at": i.created_at,
            }
            for i in interactions
        ],
        "analysis_report": {
            "predicted_engagement": analysis_report.predicted_engagement,
            "predicted_shareability": analysis_report.predicted_shareability,
            "predicted_conversion_signal": analysis_report.predicted_conversion_signal,
            "predicted_trust": analysis_report.predicted_trust,
            "top_positive_themes": analysis_report.top_positive_themes,
            "top_negative_themes": analysis_report.top_negative_themes,
            "top_objections": analysis_report.top_objections,
            "recommended_rewrite": analysis_report.recommended_rewrite,
            "created_at": analysis_report.created_at,
        }
        if analysis_report
        else None,
    }
