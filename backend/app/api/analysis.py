from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.db import SessionDep
from app.models import AnalysisReport, Run, RunStatus

router = APIRouter(prefix="/runs", tags=["analysis"])


class AnalysisRead:
    id: UUID
    run_id: UUID
    predicted_engagement: float
    predicted_shareability: float
    predicted_conversion_signal: float
    predicted_trust: float
    top_positive_themes: list[str]
    top_negative_themes: list[str]
    top_objections: list[str]
    recommended_rewrite: str | None


@router.get("/{run_id}/analysis")
def get_analysis(run_id: UUID, session: SessionDep):
    run = session.get(Run, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Run not found")

    if run.status != RunStatus.completed:
        raise HTTPException(
            status_code=400, detail="Analysis is only available for completed runs"
        )

    report = (
        session.query(AnalysisReport).filter(AnalysisReport.run_id == run_id).first()
    )

    if not report:
        raise HTTPException(status_code=404, detail="Analysis report not found")

    return report
