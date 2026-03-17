import time

from sqlmodel import Session, select

from app.db import engine
from app.logging import configure_logging, get_logger
from app.models import Run, RunStatus

configure_logging()
logger = get_logger(__name__)


def poll_for_runs():
    while True:
        try:
            with Session(engine) as session:
                run = session.exec(
                    select(Run)
                    .where(Run.status == RunStatus.queued)
                    .order_by(Run.created_at)
                    .limit(1)
                ).first()

                if run:
                    logger.info("Found queued run", run_id=str(run.id))
                    process_run(run, session)
                else:
                    time.sleep(5)
        except Exception as e:
            logger.error("Error in worker loop", error=str(e))
            time.sleep(10)


def process_run(run: Run, session: Session):
    logger.info(
        "Processing run",
        run_id=str(run.id),
        agent_count=run.agent_count,
        round_count=run.round_count,
    )

    run.status = RunStatus.running
    session.add(run)
    session.commit()

    try:
        pass
    except Exception as e:
        run.status = RunStatus.failed
        run.error_message = str(e)
        session.add(run)
        session.commit()
        logger.error("Run failed", run_id=str(run.id), error=str(e))
        return

    run.status = RunStatus.completed
    session.add(run)
    session.commit()
    logger.info("Run completed", run_id=str(run.id))


if __name__ == "__main__":
    logger.info("Starting SwarmThread worker")
    poll_for_runs()
