from typing import Any
from uuid import UUID

from fastapi import APIRouter, Header, HTTPException
from sqlmodel import col, desc, select

from app.db import SessionDep
from app.models import Run, RunSeed, User
from app.schemas.user import UserCreate, UserRead, UserRunList

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/", response_model=UserRead, status_code=201)
def create_or_get_user(user_create: UserCreate, session: SessionDep) -> dict[str, Any]:
    if user_create.id:
        existing_user = session.get(User, user_create.id)
        if existing_user:
            return {
                "id": existing_user.id,
                "created_at": existing_user.created_at,
            }

    new_user = User()
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    return {
        "id": new_user.id,
        "created_at": new_user.created_at,
    }


@router.get("/me", response_model=UserRead)
def get_current_user(x_user_id: UUID = Header(...)) -> dict[str, Any]:
    return {"id": x_user_id, "created_at": None}


@router.get("/me/runs", response_model=list[UserRunList])
def get_user_runs(
    session: SessionDep,
    x_user_id: UUID = Header(...),  # noqa: B008
    limit: int = 50,
    offset: int = 0,
) -> list[dict[str, Any]]:
    runs = session.exec(
        select(Run, RunSeed)
        .where(Run.user_id == x_user_id)
        .where(Run.id == RunSeed.run_id)
        .order_by(desc(col(Run.created_at)))
        .limit(limit)
        .offset(offset)
    ).all()

    result: list[dict[str, Any]] = []
    for run, seed in runs:
        result.append(
            {
                "run_id": run.id,
                "status": run.status,
                "title": seed.title,
                "brand": seed.brand,
                "model_name": run.model_name,
                "created_at": run.created_at,
                "completed_at": run.completed_at,
            }
        )
    return result
