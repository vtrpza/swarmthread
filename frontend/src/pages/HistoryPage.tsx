import { useEffect, useState } from "react"
import { Link } from "react-router"
import { useUserSettings } from "../hooks/useUserSettings"
import { getUserRuns } from "../api/users"
import type { UserRunList } from "../types/user"
import "./HistoryPage.css"

export default function HistoryPage() {
  const { hasApiKey } = useUserSettings()
  const [runs, setRuns] = useState<UserRunList[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!hasApiKey) {
      setIsLoading(false)
      return
    }

    const fetchRuns = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await getUserRuns()
        setRuns(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load history")
      } finally {
        setIsLoading(false)
      }
    }

    fetchRuns()
  }, [hasApiKey])

  if (!hasApiKey) {
    return (
      <main className="history-page">
        <div className="history-container">
          <div className="history-empty">
            <h2 className="history-empty-title">API Key Required</h2>
            <p className="history-empty-description">
              Configure your OpenRouter API key to view your simulation history.
            </p>
            <Link to="/settings" className="btn btn-primary">
              Go to Settings
            </Link>
          </div>
        </div>
      </main>
    )
  }

  if (isLoading) {
    return (
      <main className="history-page">
        <div className="history-container">
          <div className="history-loading">Loading...</div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="history-page">
        <div className="history-container">
          <div className="history-error">
            <h2 className="history-error-title">Error</h2>
            <p className="history-error-description">{error}</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="history-page">
      <div className="history-container">
        <header className="history-header">
          <h1 className="history-title">Simulation History</h1>
          <p className="history-subtitle">
            View your past simulations and their results.
          </p>
        </header>

        {runs.length === 0 ? (
          <div className="history-empty">
            <h2 className="history-empty-title">No Simulations Yet</h2>
            <p className="history-empty-description">
              Create your first simulation to see it here.
            </p>
            <Link to="/" className="btn btn-primary">
              Create Simulation
            </Link>
          </div>
        ) : (
          <div className="history-list">
            {runs.map((run) => (
              <Link
                key={run.run_id}
                to={`/runs/${run.run_id}`}
                className="history-item"
              >
                <div className="history-item-header">
                  <h3 className="history-item-title">{run.title}</h3>
                  <span className={`history-item-status status-${run.status}`}>
                    {run.status}
                  </span>
                </div>
                <div className="history-item-meta">
                  <span className="history-item-brand">{run.brand}</span>
                  <span className="history-item-separator">·</span>
                  <span className="history-item-model">{run.model_name}</span>
                  <span className="history-item-separator">·</span>
                  <span className="history-item-date">
                    {new Date(run.created_at).toLocaleDateString()}
                  </span>
                </div>
                {run.completed_at && (
                  <div className="history-item-completed">
                    Completed: {new Date(run.completed_at).toLocaleString()}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}