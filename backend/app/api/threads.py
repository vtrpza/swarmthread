from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.db import SessionDep
from app.models import Agent, Post, Run, RunStatus
from app.services.timeline_builder import ThreadResponse, build_thread

router = APIRouter(prefix="/runs", tags=["threads"])


@router.get("/{run_id}/threads/{post_id}", response_model=ThreadResponse)
def get_thread(run_id: UUID, post_id: UUID, session: SessionDep):
    run = session.get(Run, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    if run.status not in (RunStatus.completed, RunStatus.running):
        raise HTTPException(status_code=400, detail="Run has not started or is queued")

    root_post = session.get(Post, post_id)
    if not root_post or root_post.run_id != run_id:
        raise HTTPException(status_code=404, detail="Post not found")

    posts = session.query(Post).filter(Post.run_id == run_id).all()
    agents = session.query(Agent).filter(Agent.run_id == run_id).all()

    return build_thread(root_post, posts, agents)
