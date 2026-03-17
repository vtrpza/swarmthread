import { Link, useParams } from "react-router"
import { useRun } from "../hooks/useRun"
import { SIMULATION_PRESETS } from "../types"
import type { RunStatus, SimulationPreset } from "../types"

const STATUS_LABELS: Record<RunStatus, string> = {
  queued: "Queued",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
}

function inferPreset(agentCount: number, roundCount: number): string {
  const match = (Object.entries(SIMULATION_PRESETS) as Array<
    [SimulationPreset, (typeof SIMULATION_PRESETS)[SimulationPreset]]
  >).find(([, preset]) => {
    return preset.agentCount === agentCount && preset.roundCount === roundCount
  })

  return match ? match[1].label : "Custom"
}

function RunDetailPage() {
  const { runId } = useParams()
  const { data: run, isLoading, error } = useRun(runId!)

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner" />
        </div>
      </div>
    )
  }

  if (error || !run) {
    return (
      <div className="page-container">
        <div className="error-state">
          <div className="error-state-title">Failed to load run</div>
          <div>{error instanceof Error ? error.message : "Run not found"}</div>
          <Link to="/" className="back-link" style={{ marginTop: "16px" }}>
            Back to Create
          </Link>
        </div>
      </div>
    )
  }

  const canViewFeed = run.status === "running" || run.status === "completed"
  const canViewAnalysis = run.status === "completed"
  const presetLabel = inferPreset(run.agent_count, run.round_count)

  return (
    <div className="page-container">
      <div className="animate-reveal">
        <Link to="/" className="back-link">
          New Run
        </Link>

        <div className="run-header">
          <div className="run-title-row">
            <h1 className="page-title">{run.title}</h1>
            <span className={`status-badge status-${run.status}`}>
              {STATUS_LABELS[run.status]}
            </span>
          </div>
          <p className="run-subtitle">
            {run.brand} · {run.goal}
          </p>
        </div>

        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-value">{run.agent_count}</div>
            <div className="stat-label">Agents</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{run.round_count}</div>
            <div className="stat-label">Rounds</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{presetLabel}</div>
            <div className="stat-label">Preset</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">${run.max_total_cost_usd}</div>
            <div className="stat-label">Budget</div>
          </div>
        </div>

        <div className="section">
          <h3 className="section-title">Audience Focus</h3>
          <div className="segment-badges">
            {run.audience_segments.length > 0 ? (
              run.audience_segments.map((segment) => (
                <span key={segment} className="segment-badge">
                  {segment}
                </span>
              ))
            ) : (
              <span className="segment-badge segment-badge-muted">
                Balanced default audience mix
              </span>
            )}
          </div>
        </div>

        <div className="section">
          <h3 className="section-title">Views</h3>
          <div className="action-buttons">
            {canViewFeed ? (
              <Link to={`/runs/${runId}/feed`} className="btn btn-primary">
                View Feed
              </Link>
            ) : (
              <span className="btn btn-disabled">Feed (waiting)</span>
            )}

            {canViewAnalysis ? (
              <Link to={`/runs/${runId}/analysis`} className="btn btn-secondary">
                View Analysis
              </Link>
            ) : (
              <span className="btn btn-disabled">Analysis (waiting)</span>
            )}
          </div>
        </div>

        {run.status === "failed" && run.error_message && (
          <div className="error-state">
            <div className="error-state-title">Error</div>
            <div>{run.error_message}</div>
          </div>
        )}

        <div className="run-meta">
          <div className="meta-item">
            <span className="meta-label">Created</span>
            <span className="meta-value">{new Date(run.created_at).toLocaleString()}</span>
          </div>
          {run.started_at && (
            <div className="meta-item">
              <span className="meta-label">Started</span>
              <span className="meta-value">{new Date(run.started_at).toLocaleString()}</span>
            </div>
          )}
          {run.completed_at && (
            <div className="meta-item">
              <span className="meta-label">Completed</span>
              <span className="meta-value">{new Date(run.completed_at).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .run-header {
          margin: var(--space-8) 0;
        }

        .run-title-row {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          flex-wrap: wrap;
        }

        .run-subtitle {
          margin-top: var(--space-2);
          color: var(--text-secondary);
        }

        .section {
          margin-top: var(--space-8);
        }

        .action-buttons {
          display: flex;
          gap: var(--space-3);
          flex-wrap: wrap;
        }

        .btn-disabled {
          background: var(--bg-subtle);
          color: var(--text-muted);
          border: 1px solid var(--border-subtle);
          cursor: not-allowed;
          display: inline-flex;
          align-items: center;
          height: 48px;
          padding: 0 var(--space-5);
          border-radius: var(--radius-md);
          font-size: var(--text-base);
          font-weight: 500;
        }

        .segment-badges {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
        }

        .segment-badge {
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-md);
          background: var(--primary-subtle);
          color: var(--primary);
          border: 1px solid var(--primary-glow);
          font-size: var(--text-sm);
          font-weight: 500;
        }

        .segment-badge-muted {
          background: var(--bg-subtle);
          color: var(--text-secondary);
          border-color: var(--border-default);
        }

        .run-meta {
          margin-top: var(--space-10);
          padding: var(--space-5);
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
        }

        .meta-item {
          display: flex;
          justify-content: space-between;
          padding: var(--space-3) 0;
          border-bottom: 1px solid var(--border-subtle);
        }

        .meta-item:last-child {
          border-bottom: none;
        }

        .meta-label {
          color: var(--text-tertiary);
          font-size: var(--text-sm);
          font-weight: 500;
        }

        .meta-value {
          color: var(--text-secondary);
          font-size: var(--text-sm);
          font-family: var(--font-mono);
        }
      `}</style>
    </div>
  )
}

export default RunDetailPage
