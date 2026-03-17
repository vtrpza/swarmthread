import { useQuery } from "@tanstack/react-query"
import { Link, useParams } from "react-router"
import { getAnalysis } from "../api/runs"
import type { SegmentReaction } from "../types"

const REACTION_STYLES: Record<
  SegmentReaction["reaction"],
  { background: string; text: string; border: string }
> = {
  positive: {
    background: "var(--success-subtle)",
    text: "var(--success)",
    border: "var(--success-glow)",
  },
  mixed: {
    background: "var(--warning-subtle)",
    text: "var(--warning)",
    border: "var(--warning-glow)",
  },
  negative: {
    background: "var(--error-subtle)",
    text: "var(--error)",
    border: "var(--error-glow)",
  },
}

const RECOMMENDATION_COPY = {
  ship: "Strong enough to ship with only minor edits.",
  revise: "Needs revisions before it is safe to publish.",
  avoid: "The current version is likely to create more resistance than momentum.",
}

function MetricCard({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="metric-card">
      <div className="metric-bar-container">
        <div className="metric-bar" style={{ width: `${value * 100}%` }} />
      </div>
      <div className="metric-info">
        <span className="metric-value">{(value * 100).toFixed(0)}%</span>
        <span className="metric-label">{label}</span>
      </div>
    </div>
  )
}

function SegmentCard({ segment }: { segment: SegmentReaction }) {
  const style = REACTION_STYLES[segment.reaction]

  return (
    <article className="segment-card">
      <div className="segment-card-header">
        <div>
          <h3 className="segment-title">{segment.segment}</h3>
          <p className="segment-share">
            {(segment.simulated_share * 100).toFixed(0)}% of simulated audience
          </p>
        </div>
        <span
          className="segment-reaction"
          style={{
            background: style.background,
            color: style.text,
            borderColor: style.border,
          }}
        >
          {segment.reaction}
        </span>
      </div>

      <p className="segment-summary">{segment.summary}</p>

      <div className="segment-list-block">
        <h4>What resonated</h4>
        <div className="theme-tags">
          {segment.key_resonators.map((item) => (
            <span key={item} className="theme-tag theme-positive">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="segment-list-block">
        <h4>Key objections</h4>
        <div className="theme-tags">
          {segment.key_objections.map((item) => (
            <span key={item} className="theme-tag theme-negative">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="segment-list-block">
        <h4>Representative simulated posts</h4>
        <div className="quote-list">
          {segment.representative_posts.map((post) => (
            <blockquote key={post} className="quote-card">
              {post}
            </blockquote>
          ))}
        </div>
      </div>
    </article>
  )
}

function AnalysisPage() {
  const { runId } = useParams()
  const { data: analysis, isLoading, error } = useQuery({
    queryKey: ["analysis", runId],
    queryFn: () => getAnalysis(runId!),
  })

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <div className="loading-spinner" />
        </div>
      </div>
    )
  }

  if (error || !analysis) {
    return (
      <div className="page-container">
        <Link to={`/runs/${runId}`} className="back-link">
          Back to Run
        </Link>
        <div className="error-state">
          <div className="error-state-title">Failed to load analysis</div>
          <div>{error instanceof Error ? error.message : "Unknown error"}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="animate-reveal">
        <Link to={`/runs/${runId}`} className="back-link">
          Back to Run
        </Link>
        <h1 className="page-title">Audience Reaction Analysis</h1>
        <p className="page-subtitle">
          Directional signal based on a simulated social audience, not a guaranteed forecast.
        </p>
      </div>

      <section className="recommendation-card animate-scale">
        <div>
          <span className={`recommendation-pill recommendation-${analysis.overall_recommendation}`}>
            {analysis.overall_recommendation}
          </span>
          <h2>{RECOMMENDATION_COPY[analysis.overall_recommendation]}</h2>
          <p className="confidence-copy">
            Confidence: <strong>{analysis.confidence_label}</strong>
          </p>
        </div>

        <div className="recommendation-meta">
          <div>
            <span className="meta-label">Best fit segments</span>
            <div className="theme-tags">
              {analysis.best_fit_segments.map((segment) => (
                <span key={segment} className="theme-tag theme-positive">
                  {segment}
                </span>
              ))}
            </div>
          </div>
          <div>
            <span className="meta-label">Risky segments</span>
            <div className="theme-tags">
              {analysis.risky_segments.map((segment) => (
                <span key={segment} className="theme-tag theme-negative">
                  {segment}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="segment-grid">
        {analysis.segment_reactions.map((segment) => (
          <SegmentCard key={segment.segment} segment={segment} />
        ))}
      </section>

      <section className="analysis-section">
        <h2 className="section-title">Directional Metrics</h2>
        <div className="metrics-grid">
          <MetricCard label="Engagement" value={analysis.predicted_engagement} />
          <MetricCard label="Shareability" value={analysis.predicted_shareability} />
          <MetricCard label="Conversion" value={analysis.predicted_conversion_signal} />
          <MetricCard label="Trust" value={analysis.predicted_trust} />
        </div>
      </section>

      <section className="analysis-section">
        <h2 className="section-title">Overall Themes</h2>
        <div className="theme-split">
          <div>
            <h3 className="mini-title">Positive themes</h3>
            <div className="theme-tags">
              {analysis.top_positive_themes.map((theme) => (
                <span key={theme} className="theme-tag theme-positive">
                  {theme}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mini-title">Negative themes</h3>
            <div className="theme-tags">
              {analysis.top_negative_themes.map((theme) => (
                <span key={theme} className="theme-tag theme-negative">
                  {theme}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mini-title">Top objections</h3>
            <div className="theme-tags">
              {analysis.top_objections.map((theme) => (
                <span key={theme} className="theme-tag theme-warning">
                  {theme}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {analysis.recommended_rewrite && (
        <section className="analysis-section">
          <h2 className="section-title">Recommended Rewrite</h2>
          <div className="rewrite-card">{analysis.recommended_rewrite}</div>
        </section>
      )}

      <style>{`
        .page-subtitle {
          color: var(--text-secondary);
          margin-top: var(--space-2);
          max-width: 52rem;
        }

        .recommendation-card,
        .analysis-section,
        .segment-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xl);
          padding: var(--space-6);
          margin-top: var(--space-6);
        }

        .recommendation-card {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: var(--space-6);
        }

        .recommendation-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-size: var(--text-xs);
          font-weight: 700;
          margin-bottom: var(--space-3);
        }

        .recommendation-ship {
          background: var(--success-subtle);
          color: var(--success);
        }

        .recommendation-revise {
          background: var(--warning-subtle);
          color: var(--warning);
        }

        .recommendation-avoid {
          background: var(--error-subtle);
          color: var(--error);
        }

        .confidence-copy {
          margin-top: var(--space-3);
          color: var(--text-secondary);
        }

        .recommendation-meta {
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
        }

        .meta-label,
        .mini-title {
          display: block;
          font-size: var(--text-sm);
          font-weight: 600;
          margin-bottom: var(--space-2);
          color: var(--text-secondary);
        }

        .segment-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: var(--space-5);
          margin-top: var(--space-6);
        }

        .segment-card-header {
          display: flex;
          justify-content: space-between;
          gap: var(--space-4);
          align-items: flex-start;
        }

        .segment-title {
          margin: 0;
        }

        .segment-share {
          margin-top: var(--space-1);
          color: var(--text-secondary);
          font-size: var(--text-sm);
        }

        .segment-reaction {
          border: 1px solid transparent;
          border-radius: 999px;
          padding: 0.3rem 0.7rem;
          text-transform: uppercase;
          font-size: var(--text-xs);
          font-weight: 700;
          letter-spacing: 0.08em;
        }

        .segment-summary {
          color: var(--text-secondary);
          margin-top: var(--space-4);
          line-height: var(--leading-relaxed);
        }

        .segment-list-block {
          margin-top: var(--space-5);
        }

        .segment-list-block h4 {
          margin-bottom: var(--space-2);
        }

        .quote-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }

        .quote-card {
          margin: 0;
          padding: var(--space-3);
          border-left: 3px solid var(--primary);
          background: var(--bg-subtle);
          color: var(--text-secondary);
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: var(--space-4);
        }

        .metric-card {
          padding: var(--space-4);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-subtle);
          background: var(--bg-subtle);
        }

        .metric-bar-container {
          height: 6px;
          background: var(--border-subtle);
          border-radius: 999px;
          overflow: hidden;
          margin-bottom: var(--space-4);
        }

        .metric-bar {
          height: 100%;
          background: var(--primary);
        }

        .metric-info {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .metric-value {
          font-family: var(--font-mono);
          font-size: var(--text-2xl);
          font-weight: 600;
        }

        .metric-label {
          color: var(--text-secondary);
          font-size: var(--text-sm);
        }

        .theme-split {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: var(--space-5);
        }

        .theme-tags {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
        }

        .theme-tag {
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          font-weight: 500;
        }

        .theme-positive {
          background: var(--success-subtle);
          color: var(--success);
        }

        .theme-negative {
          background: var(--error-subtle);
          color: var(--error);
        }

        .theme-warning {
          background: var(--warning-subtle);
          color: var(--warning);
        }

        .rewrite-card {
          background: var(--primary-subtle);
          border: 1px solid var(--primary-glow);
          border-radius: var(--radius-lg);
          padding: var(--space-5);
          line-height: var(--leading-relaxed);
        }

        @media (max-width: 900px) {
          .recommendation-card,
          .theme-split,
          .metrics-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

export default AnalysisPage
