from datetime import datetime
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.db import SessionDep
from app.models import AnalysisReport, Run, RunStatus

router = APIRouter(prefix="/runs", tags=["analysis"])


class SegmentReactionRead(BaseModel):
    segment: str
    simulated_share: float
    reaction: Literal["positive", "mixed", "negative"]
    summary: str
    key_resonators: list[str]
    key_objections: list[str]
    representative_posts: list[str]


class AnalysisRead(BaseModel):
    id: UUID
    run_id: UUID
    predicted_engagement: float
    predicted_shareability: float
    predicted_conversion_signal: float
    predicted_trust: float
    overall_recommendation: Literal["ship", "revise", "avoid"]
    confidence_label: Literal["low", "medium", "high"]
    best_fit_segments: list[str]
    risky_segments: list[str]
    segment_reactions: list[SegmentReactionRead]
    top_positive_themes: list[str]
    top_negative_themes: list[str]
    top_objections: list[str]
    recommended_rewrite: str | None
    created_at: datetime


class RunSummary(BaseModel):
    id: UUID
    status: RunStatus
    agent_count: int
    round_count: int
    model_name: str
    created_at: datetime
    completed_at: datetime | None


class AnalysisExport(BaseModel):
    run: RunSummary
    analysis: AnalysisRead


def _serialize_analysis(report: AnalysisReport) -> AnalysisRead:
    raw_json = report.raw_json or {}

    return AnalysisRead(
        id=report.id,
        run_id=report.run_id,
        predicted_engagement=report.predicted_engagement,
        predicted_shareability=report.predicted_shareability,
        predicted_conversion_signal=report.predicted_conversion_signal,
        predicted_trust=report.predicted_trust,
        overall_recommendation=raw_json.get("overall_recommendation", "revise"),
        confidence_label=raw_json.get("confidence_label", "medium"),
        best_fit_segments=raw_json.get("best_fit_segments", []),
        risky_segments=raw_json.get("risky_segments", []),
        segment_reactions=[
            SegmentReactionRead.model_validate(item)
            for item in raw_json.get("segment_reactions", [])
        ],
        top_positive_themes=report.top_positive_themes,
        top_negative_themes=report.top_negative_themes,
        top_objections=report.top_objections,
        recommended_rewrite=report.recommended_rewrite,
        created_at=report.created_at,
    )


@router.get("/{run_id}/analysis", response_model=AnalysisRead)
def get_analysis(run_id: UUID, session: SessionDep) -> AnalysisRead:
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

    return _serialize_analysis(report)


@router.get("/{run_id}/analysis/export", response_model=AnalysisExport)
def export_analysis(run_id: UUID, session: SessionDep) -> JSONResponse:
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

    run_summary = RunSummary(
        id=run.id,
        status=run.status,
        agent_count=run.agent_count,
        round_count=run.round_count,
        model_name=run.model_name,
        created_at=run.created_at,
        completed_at=run.completed_at,
    )

    analysis_read = _serialize_analysis(report)

    export_data = AnalysisExport(run=run_summary, analysis=analysis_read)

    return JSONResponse(
        content=export_data.model_dump(mode="json"),
        headers={"Content-Disposition": f"attachment; filename=analysis_{run_id}.json"},
    )
