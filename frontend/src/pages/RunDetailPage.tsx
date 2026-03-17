import { useState } from "react"
import { Link, useParams } from "react-router"
import { useCancelRun, useRun } from "../hooks/useRun"
import { SIMULATION_PRESETS } from "../types"
import { formatCurrency, formatDateTime, pluralize } from "../utils/formatters"
import type { RunStatus, SimulationPreset } from "../types"
import "./RunDetailPage.css"

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "setup", label: "Setup" },
  { id: "timeline", label: "Timeline" },
] as const

type TabId = (typeof TABS)[number]["id"]

const STATUS_CONFIG: Record<
  RunStatus,
  {
    label: string
    description: string
    theme: "default" | "active" | "success" | "error"
    progress: number
  }
> = {
  queued: {
    label: "Queued",
    description: "Waiting for simulation capacity",
    theme: "default",
    progress: 10,
  },
  running: {
    label: "Running",
    description: "Live simulation in progress",
    theme: "active",
    progress: 50,
  },
  completed: {
    label: "Completed",
    description: "Simulation finished successfully",
    theme: "success",
    progress: 100,
  },
  failed: {
    label: "Failed",
    description: "Execution ended with an error",
    theme: "error",
    progress: 100,
  },
  cancelled: {
    label: "Cancelled",
    description: "Stopped before completion",
    theme: "default",
    progress: 100,
  },
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
  const resolvedRunId = runId ?? ""
  const { data: run, isLoading, error } = useRun(resolvedRunId)
  const cancelRun = useCancelRun(resolvedRunId)
  const [activeTab, setActiveTab] = useState<TabId>("overview")

  if (isLoading) {
    return (
      <main className="run-detail-page">
        <div className="run-detail-container">
          <div className="run-detail-loading">
            <div className="loading-spinner" />
          </div>
        </div>
      </main>
    )
  }

  if (error || !run) {
    return (
      <main className="run-detail-page">
        <div className="run-detail-container">
          <div className="run-detail-error animate-reveal">
            <Link to="/" className="back-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to Home
            </Link>
            <div className="error-state">
              <div className="error-state-title">Failed to load run</div>
              <p>{error instanceof Error ? error.message : "Run not found"}</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const presetLabel = inferPreset(run.agent_count, run.round_count)
  const statusConfig = STATUS_CONFIG[run.status]
  const canViewFeed = run.status === "running" || run.status === "completed"
  const canViewAnalysis = run.status === "completed"
  const canCancelRun = run.status === "queued" || run.status === "running"

  const renderOverviewTab = () => (
    <>
      {/* Status Card */}
      <section className={`run-detail-card run-detail-status-card status-${statusConfig.theme}`}>
        <div className="status-header">
          <div className="status-info">
            <span className={`status-badge-large status-${run.status}`}>
              {statusConfig.label}
            </span>
            <p className="status-description">{statusConfig.description}</p>
          </div>
          <div className="status-progress">
            <span className="progress-value">{statusConfig.progress}%</span>
          </div>
        </div>

        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${statusConfig.progress}%` }}
          />
        </div>

        {(run.status === "queued" || run.status === "running") && (
          <div className="status-meta">
            <span className="live-indicator">
              <span className="live-dot" />
              Auto-refreshing
            </span>
          </div>
        )}
      </section>

      {/* Quick Stats */}
      <section className="run-detail-quick-stats">
        <article className="quick-stat-card">
          <span className="quick-stat-label">Preset</span>
          <strong className="quick-stat-value">{presetLabel}</strong>
          <p className="quick-stat-detail">{run.agent_count} agents · {run.round_count} rounds</p>
        </article>
        <article className="quick-stat-card">
          <span className="quick-stat-label">Budget</span>
          <strong className="quick-stat-value">{formatCurrency(run.max_total_cost_usd)}</strong>
          <p className="quick-stat-detail">Maximum configured spend</p>
        </article>
        <article className="quick-stat-card">
          <span className="quick-stat-label">Model</span>
          <strong className="quick-stat-value model-value">{run.model_name}</strong>
          <p className="quick-stat-detail">Inference engine</p>
        </article>
        <article className="quick-stat-card">
          <span className="quick-stat-label">Audience</span>
          <strong className="quick-stat-value">
            {run.audience_segments.length > 0 ? run.audience_segments.length : "Default"}
          </strong>
          <p className="quick-stat-detail">
            {run.audience_segments.length > 0
              ? pluralize(run.audience_segments.length, "priority segment")
              : "Balanced mix"}
          </p>
        </article>
      </section>

      {/* Output Actions */}
      <section className="run-detail-outputs">
        <div className="section-header-compact">
          <h2 className="section-title">Simulation Outputs</h2>
          <p className="section-subtitle">Access feed and analysis as they become available</p>
        </div>

        <div className="output-cards">
          <article className={`output-card ${canViewFeed ? "" : "output-card-disabled"}`}>
            <div className="output-card-header">
              <div className="output-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9M12 20V4m0 16l-7-7m7 7l7-7M12 4H3m9 0l-7 7m7-7l7 7" />
                </svg>
              </div>
              <div className="output-card-title-group">
                <h3>Live Feed</h3>
                <span className={`output-status ${canViewFeed ? "available" : "locked"}`}>
                  {canViewFeed ? "Available" : "Locked"}
                </span>
              </div>
            </div>
            <p className="output-description">
              View the simulated post stream and see how conversations branch in real time.
            </p>
            {canViewFeed ? (
              <Link
                to={`/runs/${resolvedRunId}/feed`}
                className="btn btn-primary btn-full"
              >
                Open Feed
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            ) : (
              <span className="output-locked-message">Available once simulation starts</span>
            )}
          </article>

          <article className={`output-card ${canViewAnalysis ? "" : "output-card-disabled"}`}>
            <div className="output-card-header">
              <div className="output-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="output-card-title-group">
                <h3>Analysis Report</h3>
                <span className={`output-status ${canViewAnalysis ? "available" : "locked"}`}>
                  {canViewAnalysis ? "Ready" : "Pending"}
                </span>
              </div>
            </div>
            <p className="output-description">
              Review synthesized takeaways, risky segments, and rewrite guidance.
            </p>
            {canViewAnalysis ? (
              <Link
                to={`/runs/${resolvedRunId}/analysis`}
                className="btn btn-secondary btn-full"
              >
                View Analysis
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ) : (
              <span className="output-locked-message">Available after completion</span>
            )}
          </article>
        </div>
      </section>

      {/* Run Control */}
      {canCancelRun && (
        <section className="run-detail-control">
          <div className="control-card">
            <div className="control-info">
              <h3 className="control-title">Operational Control</h3>
              <p className="control-description">
                Stop the run when the signal is clear or additional spend is no longer justified.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-danger"
              onClick={() => cancelRun.mutate()}
              disabled={cancelRun.isPending}
            >
              {cancelRun.isPending ? (
                <>
                  <span className="btn-spinner" />
                  Cancelling...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M15 9l-6 6M9 9l6 6" />
                  </svg>
                  Cancel Run
                </>
              )}
            </button>
          </div>
        </section>
      )}

      {/* Error Display */}
      {(cancelRun.error || (run.status === "failed" && run.error_message)) && (
        <section className="run-detail-alerts">
          <div className="section-header-compact">
            <h2 className="section-title">Attention Required</h2>
          </div>
          <div className="alert-stack">
            {cancelRun.error && (
              <div className="alert-card alert-error">
                <div className="alert-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                </div>
                <div className="alert-content">
                  <h4>Failed to cancel run</h4>
                  <p>{cancelRun.error instanceof Error ? cancelRun.error.message : "Unknown error"}</p>
                </div>
              </div>
            )}
            {run.status === "failed" && run.error_message && (
              <div className="alert-card alert-error">
                <div className="alert-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    <path d="M12 9v4M12 17h.01" />
                  </svg>
                </div>
                <div className="alert-content">
                  <h4>Run failure details</h4>
                  <p>{run.error_message}</p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  )

  const renderSetupTab = () => (
    <section className="run-detail-setup">
      <div className="run-detail-card">
        <div className="card-header">
          <span className="card-eyebrow">Configuration</span>
          <h2 className="card-title">Simulation Parameters</h2>
          <p className="card-description">
            The settings below determine how much synthetic audience pressure the message receives.
          </p>
        </div>

        <div className="setup-grid">
          <div className="setup-item">
            <span className="setup-label">Agents</span>
            <strong className="setup-value">{run.agent_count}</strong>
            <p className="setup-note">Distinct simulated voices in the network</p>
          </div>
          <div className="setup-item">
            <span className="setup-label">Rounds</span>
            <strong className="setup-value">{run.round_count}</strong>
            <p className="setup-note">Interaction depth before completion</p>
          </div>
          <div className="setup-item">
            <span className="setup-label">Preset</span>
            <strong className="setup-value">{presetLabel}</strong>
            <p className="setup-note">Inferred from agent and round count</p>
          </div>
          <div className="setup-item">
            <span className="setup-label">Model</span>
            <strong className="setup-value model-value">{run.model_name}</strong>
            <p className="setup-note">Inference engine for agent decisions</p>
          </div>
          <div className="setup-item setup-item-full">
            <span className="setup-label">Budget Cap</span>
            <strong className="setup-value">{formatCurrency(run.max_total_cost_usd)}</strong>
            <p className="setup-note">Maximum configured spend for this run</p>
          </div>
        </div>
      </div>

      <div className="run-detail-card">
        <div className="card-header">
          <span className="card-eyebrow">Content</span>
          <h2 className="card-title">Message Brief</h2>
        </div>

        <div className="brief-content">
          <div className="brief-field">
            <span className="brief-label">Brand</span>
            <p className="brief-value">{run.brand}</p>
          </div>
          <div className="brief-field">
            <span className="brief-label">Goal</span>
            <p className="brief-value">{run.goal}</p>
          </div>

        </div>
      </div>

      <div className="run-detail-card">
        <div className="card-header">
          <span className="card-eyebrow">Targeting</span>
          <h2 className="card-title">Audience Segments</h2>
          <p className="card-description">
            Selected segments receive extra interpretive weight in analysis and recommendations.
          </p>
        </div>

        {run.audience_segments.length > 0 ? (
          <div className="segment-chips">
            {run.audience_segments.map((segment) => (
              <span key={segment} className="segment-chip">
                {segment}
              </span>
            ))}
          </div>
        ) : (
          <p className="empty-segments">
            No priority segments selected. Using balanced default audience mix.
          </p>
        )}
      </div>
    </section>
  )

  const renderTimelineTab = () => (
    <section className="run-detail-timeline">
      <div className="run-detail-card">
        <div className="card-header">
          <span className="card-eyebrow">History</span>
          <h2 className="card-title">Run Timeline</h2>
          <p className="card-description">
            Lifecycle metadata tracking from queue to completion.
          </p>
        </div>

        <div className="timeline">
          <div className={`timeline-item ${run.created_at ? "completed" : ""}`}>
            <div className="timeline-marker">
              <div className="timeline-dot" />
              <div className="timeline-line" />
            </div>
            <div className="timeline-content">
              <div className="timeline-header">
                <h4>Created</h4>
                <span className="timeline-time">{formatDateTime(run.created_at)}</span>
              </div>
              <p className="timeline-note">Run accepted and queued for processing</p>
            </div>
          </div>

          <div className={`timeline-item ${run.started_at ? "completed" : ""} ${run.status === "running" ? "active" : ""}`}>
            <div className="timeline-marker">
              <div className="timeline-dot" />
              <div className="timeline-line" />
            </div>
            <div className="timeline-content">
              <div className="timeline-header">
                <h4>Started</h4>
                <span className="timeline-time">
                  {run.started_at ? formatDateTime(run.started_at) : "Pending"}
                </span>
              </div>
              <p className="timeline-note">
                {run.started_at ? "Worker began execution" : "Waiting for available worker"}
              </p>
            </div>
          </div>

          <div className={`timeline-item ${run.completed_at ? "completed" : ""} ${run.status === "running" ? "active" : ""}`}>
            <div className="timeline-marker">
              <div className="timeline-dot" />
            </div>
            <div className="timeline-content">
              <div className="timeline-header">
                <h4>{run.status === "completed" ? "Completed" : "Ended"}</h4>
                <span className="timeline-time">
                  {run.completed_at ? formatDateTime(run.completed_at) : "In progress"}
                </span>
              </div>
              <p className="timeline-note">
                {run.completed_at
                  ? run.status === "completed"
                    ? "Simulation finished successfully"
                    : statusConfig.description
                  : "Simulation still running"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="run-detail-card run-detail-meta-card">
        <div className="meta-grid">
          <div className="meta-item">
            <span className="meta-label">Run ID</span>
            <code className="meta-value">{run.id}</code>
          </div>
          <div className="meta-item">
            <span className="meta-label">Current Status</span>
            <span className={`meta-value status-text status-${run.status}`}>
              {statusConfig.label}
            </span>
          </div>
        </div>
      </div>
    </section>
  )

  return (
    <main className="run-detail-page">
      <div className="run-detail-container">
        {/* Header */}
        <header className="run-detail-header animate-reveal">
          <Link to="/" className="back-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
          <h1 className="run-detail-title">{run.title}</h1>
          <p className="run-detail-subtitle">
            Simulation control room · {run.brand} · {run.goal}
          </p>
        </header>

        {/* Tabs */}
        <nav className="run-detail-tabs animate-fade" aria-label="Run sections">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`tab-button ${activeTab === tab.id ? "tab-button-active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
              aria-selected={activeTab === tab.id}
              role="tab"
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Tab Content */}
        <div className="run-detail-content animate-scale">
          {activeTab === "overview" && renderOverviewTab()}
          {activeTab === "setup" && renderSetupTab()}
          {activeTab === "timeline" && renderTimelineTab()}
        </div>
      </div>
    </main>
  )
}

export default RunDetailPage
