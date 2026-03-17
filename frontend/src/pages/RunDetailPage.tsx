import { useParams, Link } from "react-router"
import { useRun } from "../hooks/useRun"
import type { RunStatus } from "../types"

const STATUS_LABELS: Record<RunStatus, string> = {
  queued: "Queued",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
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
            ← Back to Create
          </Link>
        </div>
      </div>
    )
  }

  const canViewFeed = run.status === "running" || run.status === "completed"
  const canViewAnalysis = run.status === "completed"

  return (
    <div className="page-container">
      <div className="animate-fade-in">
        <Link to="/" className="back-link">
          ← New Run
        </Link>

        <div className="run-header">
          <div className="run-title-row">
            <h1 className="page-title">Run {run.id.slice(0, 8)}</h1>
            <span className={`status-badge status-${run.status}`}>
              {STATUS_LABELS[run.status]}
            </span>
          </div>
        </div>

        <div className="stat-grid stagger-item stagger-1">
          <div className="stat-card">
            <div className="stat-value">{run.agent_count}</div>
            <div className="stat-label">Agents</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{run.round_count}</div>
            <div className="stat-label">Rounds</div>
          </div>
          <div className="stat-card">
            <div className="stat-value truncate" title={run.model_name}>
              {run.model_name.split("/").pop()}
            </div>
            <div className="stat-label">Model</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">${run.max_total_cost_usd}</div>
            <div className="stat-label">Max Cost</div>
          </div>
        </div>

        <div className="section">
          <h3 className="section-title">Views</h3>
          <div className="action-buttons">
            {canViewFeed ? (
              <Link
                to={`/runs/${runId}/feed`}
                className="btn btn-primary"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 4h12M2 8h8M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                View Feed
              </Link>
            ) : (
              <span className="btn btn-disabled">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" opacity="0.5">
                  <path d="M2 4h12M2 8h8M2 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                Feed (waiting)
              </span>
            )}
            {canViewAnalysis ? (
              <Link
                to={`/runs/${runId}/analysis`}
                className="btn btn-primary"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 14V8l3 4 3-6 4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                View Analysis
              </Link>
            ) : (
              <span className="btn btn-disabled">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" opacity="0.5">
                  <path d="M3 14V8l3 4 3-6 4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Analysis (waiting)
              </span>
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
          margin: var(--space-6) 0;
        }

        .run-title-row {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          flex-wrap: wrap;
        }

        .action-buttons {
          display: flex;
          gap: var(--space-3);
          flex-wrap: wrap;
        }

        .btn-disabled {
          background: var(--bg-page);
          color: var(--text-disabled);
          border: 1px solid var(--border-color);
          cursor: not-allowed;
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          height: 36px;
          padding: 0 var(--space-4);
          border-radius: var(--radius-md);
          font-size: var(--text-base);
        }

        .run-meta {
          margin-top: var(--space-8);
          padding: var(--space-5);
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
        }

        .meta-item {
          display: flex;
          justify-content: space-between;
          padding: var(--space-2) 0;
          border-bottom: 1px solid var(--border-color-light);
        }

        .meta-item:last-child {
          border-bottom: none;
        }

        .meta-label {
          color: var(--text-secondary);
          font-size: var(--text-sm);
        }

        .meta-value {
          color: var(--text-primary);
          font-size: var(--text-sm);
          font-weight: 500;
        }
      `}</style>
    </div>
  )
}

export default RunDetailPage
