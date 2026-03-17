import asyncio

from sqlalchemy import select

from app.db_async import AsyncSessionLocal
from app.logging import configure_logging, get_logger
from app.models import Run, RunStatus
from app.services.simulation_runner import SimulationRunner

configure_logging()
logger = get_logger(__name__)


async def poll_for_runs():
    while True:
        try:
            async with AsyncSessionLocal() as session:
                result = await session.execute(
                    select(Run)
                    .where(Run.status == RunStatus.queued)
                    .order_by(Run.created_at)
                    .limit(1)
                )
                run = result.scalar_one_or_none()

                if run:
                    logger.info("Found queued run", run_id=str(run.id))
                    await process_run(run, session)
                else:
                    await asyncio.sleep(5)
        except Exception as e:
            logger.error("Error in worker loop", error=str(e))
            await asyncio.sleep(10)


async def process_run(run: Run, session):
    logger.info(
        "Processing run",
        run_id=str(run.id),
        agent_count=run.agent_count,
        round_count=run.round_count,
    )

    runner = SimulationRunner(session)

    try:
        await runner.run_simulation(run)
        await runner.run_analysis(run)
        logger.info("Run completed successfully", run_id=str(run.id))
    except Exception as e:
        logger.error("Run failed", run_id=str(run.id), error=str(e))


if __name__ == "__main__":
    logger.info("Starting SwarmThread worker")
    asyncio.run(poll_for_runs())
