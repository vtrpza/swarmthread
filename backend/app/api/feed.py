from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.db import SessionDep
from app.models import Agent, Post, Run, RunStatus
from app.services.timeline_builder import FeedResponse, build_feed

router = APIRouter(prefix="/runs", tags=["feed"])


@router.get("/{run_id}/feed", response_model=FeedResponse)
def get_feed(run_id: UUID, session: SessionDep):
    run = session.get(Run, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    if run.status not in (RunStatus.completed, RunStatus.running):
        raise HTTPException(status_code=400, detail="Run has not started or is queued")

    posts = session.query(Post).filter(Post.run_id == run_id).all()
    agents = session.query(Agent).filter(Agent.run_id == run_id).all()

    return build_feed(posts, agents)
