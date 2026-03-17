from uuid import UUID

from fastapi import APIRouter, Header, HTTPException
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
    User,
)
from app.schemas.run import RunCreate, RunExport, RunRead
from app.services.encryption import encrypt_api_key

router = APIRouter(prefix="/runs", tags=["runs"])

SIMULATION_PRESETS = {
    "quick": {"agent_count": 12, "round_count": 60},
    "standard": {"agent_count": 24, "round_count": 120},
    "deep": {"agent_count": 40, "round_count": 200},
}


def _normalize_seed_payload(run_create: RunCreate) -> dict[str, object]:
    title = run_create.title or f"{run_create.brand} - {run_create.goal}"
    content_type = run_create.content_type or "general"
    cta = run_create.cta or ""
    tone = run_create.tone or "inferred from message"
    audience_segments = run_create.audience_segments or []

    return {
        "title": title,
        "content_type": content_type,
        "cta": cta,
        "tone": tone,
        "audience_segments": audience_segments,
    }


def _resolve_simulation_settings(run_create: RunCreate) -> dict[str, int]:
    preset = SIMULATION_PRESETS[run_create.simulation_preset]
    return {
        "agent_count": run_create.agent_count or preset["agent_count"],
        "round_count": run_create.round_count or preset["round_count"],
    }


def _serialize_run(run: Run, seed: RunSeed) -> dict:
    return {
        "id": run.id,
        "status": run.status,
        "agent_count": run.agent_count,
        "round_count": run.round_count,
        "model_name": run.model_name,
        "max_total_cost_usd": run.max_total_cost_usd,
        "created_at": run.created_at,
        "started_at": run.started_at,
        "completed_at": run.completed_at,
        "error_message": run.error_message,
        "title": seed.title,
        "brand": seed.brand,
        "goal": seed.goal,
        "audience_segments": seed.audience_segments,
    }


@router.post("/", response_model=RunRead, status_code=201)
def create_run(
    run_create: RunCreate,
    session: SessionDep,
    x_user_id: UUID = Header(...),  # noqa: B008
    x_openrouter_key: str = Header(...),  # noqa: B008
) -> dict:
    user = session.get(User, x_user_id)
    if not user:
        user = User(id=x_user_id)
        session.add(user)
        session.commit()
        session.refresh(user)

    simulation_settings = _resolve_simulation_settings(run_create)
    seed_payload = _normalize_seed_payload(run_create)

    encrypted_key = encrypt_api_key(x_openrouter_key)

    run = Run(
        agent_count=simulation_settings["agent_count"],
        round_count=simulation_settings["round_count"],
        model_name=run_create.model_name,
        max_total_cost_usd=run_create.max_total_cost_usd,
        status=RunStatus.queued,
        user_id=x_user_id,
        encrypted_api_key=encrypted_key,
    )
    session.add(run)
    session.commit()
    session.refresh(run)

    seed = RunSeed(
        run_id=run.id,
        title=str(seed_payload["title"]),
        brand=run_create.brand,
        goal=run_create.goal,
        content_type=str(seed_payload["content_type"]),
        message=run_create.message,
        cta=str(seed_payload["cta"]),
        tone=str(seed_payload["tone"]),
        audience_segments=list(seed_payload["audience_segments"]),
    )
    session.add(seed)
    session.commit()
    session.refresh(seed)

    return _serialize_run(run, seed)


@router.get("/{run_id}", response_model=RunRead)
def get_run(run_id: UUID, session: SessionDep) -> dict:
    run = session.get(Run, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    seed = session.exec(select(RunSeed).where(RunSeed.run_id == run_id)).first()
    if not seed:
        raise HTTPException(status_code=404, detail="Run seed not found")
    return _serialize_run(run, seed)


@router.post("/{run_id}/cancel", response_model=RunRead)
def cancel_run(run_id: UUID, session: SessionDep) -> dict:
    run = session.get(Run, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")
    if run.status not in (RunStatus.queued, RunStatus.running):
        raise HTTPException(status_code=400, detail="Run cannot be cancelled")
    run.status = RunStatus.cancelled
    session.add(run)
    session.commit()
    session.refresh(run)
    seed = session.exec(select(RunSeed).where(RunSeed.run_id == run_id)).first()
    if not seed:
        raise HTTPException(status_code=404, detail="Run seed not found")
    return _serialize_run(run, seed)


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

    seed = session.exec(select(RunSeed).where(RunSeed.run_id == run_id)).first()
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
        "run": RunRead.model_validate(_serialize_run(run, seed)),
        "seed": {
            "title": seed.title,
            "brand": seed.brand,
            "goal": seed.goal,
            "content_type": seed.content_type,
            "message": seed.message,
            "cta": seed.cta,
            "tone": seed.tone,
            "audience_segments": seed.audience_segments,
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
            "overall_recommendation": (
                (analysis_report.raw_json or {}).get("overall_recommendation")
                or "revise"
            ),
            "confidence_label": (
                (analysis_report.raw_json or {}).get("confidence_label") or "medium"
            ),
            "best_fit_segments": (
                (analysis_report.raw_json or {}).get("best_fit_segments") or []
            ),
            "risky_segments": (
                (analysis_report.raw_json or {}).get("risky_segments") or []
            ),
            "segment_reactions": (
                (analysis_report.raw_json or {}).get("segment_reactions") or []
            ),
            "top_positive_themes": analysis_report.top_positive_themes,
            "top_negative_themes": analysis_report.top_negative_themes,
            "top_objections": analysis_report.top_objections,
            "recommended_rewrite": analysis_report.recommended_rewrite,
            "created_at": analysis_report.created_at,
        }
        if analysis_report
        else None,
    }
