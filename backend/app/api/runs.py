from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.db import SessionDep
from app.models import Run, RunSeed, RunStatus
from app.schemas.run import RunCreate, RunRead

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
