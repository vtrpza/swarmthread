from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.db import SessionDep
from app.models import Agent, Interaction, Post, Run, RunStatus
from app.services.timeline_builder import AgentResponse, build_agent_profile

router = APIRouter(prefix="/runs", tags=["agents"])


@router.get("/{run_id}/agents/{agent_id}", response_model=AgentResponse)
def get_agent(run_id: UUID, agent_id: UUID, session: SessionDep):
    run = session.get(Run, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    if run.status not in (RunStatus.completed, RunStatus.running):
        raise HTTPException(status_code=400, detail="Run has not started or is queued")

    agent = session.get(Agent, agent_id)
    if not agent or agent.run_id != run_id:
        raise HTTPException(status_code=404, detail="Agent not found")

    posts = session.query(Post).filter(Post.run_id == run_id).all()
    interactions = session.query(Interaction).filter(Interaction.run_id == run_id).all()

    return build_agent_profile(agent, posts, interactions)
