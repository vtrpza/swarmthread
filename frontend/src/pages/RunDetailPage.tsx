import { useParams, Link } from "react-router"
import { useRun } from "../hooks/useRun"
import type { RunStatus } from "../types"

const STATUS_COLORS: Record<RunStatus, string> = {
  queued: "bg-yellow-100 text-yellow-800",
  running: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
}

function RunDetailPage() {
  const { runId } = useParams()
  const { data: run, isLoading, error } = useRun(runId!)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-[var(--text)]">Loading...</div>
      </div>
    )
  }

  if (error || !run) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="p-4 rounded bg-red-100 text-red-700">
          Failed to load run: {error instanceof Error ? error.message : "Run not found"}
        </div>
        <Link to="/" className="mt-4 inline-block text-[var(--accent)]">
          ← Back to Create
        </Link>
      </div>
    )
  }

  const canViewFeed = run.status === "running" || run.status === "completed"
  const canViewAnalysis = run.status === "completed"

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/" className="text-[var(--accent)] hover:underline">
        ← New Run
      </Link>

      <div className="mt-6 flex items-center gap-4">
        <h1>Run {run.id.slice(0, 8)}</h1>
        <span
          className={`px-3 py-1 rounded text-sm font-medium ${STATUS_COLORS[run.status]}`}
        >
          {run.status}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded bg-[var(--border)]">
          <div className="text-sm text-[var(--text)]">Agents</div>
          <div className="text-xl font-semibold">{run.agent_count}</div>
        </div>
        <div className="p-4 rounded bg-[var(--border)]">
          <div className="text-sm text-[var(--text)]">Rounds</div>
          <div className="text-xl font-semibold">{run.round_count}</div>
        </div>
        <div className="p-4 rounded bg-[var(--border)]">
          <div className="text-sm text-[var(--text)]">Model</div>
          <div className="text-sm font-medium truncate">{run.model_name}</div>
        </div>
        <div className="p-4 rounded bg-[var(--border)]">
          <div className="text-sm text-[var(--text)]">Max Cost</div>
          <div className="text-xl font-semibold">${run.max_total_cost_usd}</div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-medium mb-4">Views</h2>
        <div className="flex flex-wrap gap-3">
          {canViewFeed && (
            <Link
              to={`/runs/${runId}/feed`}
              className="px-4 py-2 rounded bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
            >
              View Feed
            </Link>
          )}
          {!canViewFeed && (
            <span className="px-4 py-2 rounded bg-[var(--border)] text-[var(--text)] cursor-not-allowed">
              Feed (waiting for completion)
            </span>
          )}
          {canViewAnalysis && (
            <Link
              to={`/runs/${runId}/analysis`}
              className="px-4 py-2 rounded bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
            >
              View Analysis
            </Link>
          )}
          {!canViewAnalysis && (
            <span className="px-4 py-2 rounded bg-[var(--border)] text-[var(--text)] cursor-not-allowed">
              Analysis (waiting for completion)
            </span>
          )}
        </div>
      </div>

      {run.status === "failed" && run.error_message && (
        <div className="mt-8 p-4 rounded bg-red-100 text-red-700">
          <h3 className="font-medium mb-2">Error</h3>
          <p>{run.error_message}</p>
        </div>
      )}

      <div className="mt-8 text-sm text-[var(--text)]">
        <p>Created: {new Date(run.created_at).toLocaleString()}</p>
        {run.started_at && <p>Started: {new Date(run.started_at).toLocaleString()}</p>}
        {run.completed_at && (
          <p>Completed: {new Date(run.completed_at).toLocaleString()}</p>
        )}
      </div>
    </div>
  )
}

export default RunDetailPage
