import { useQuery } from "@tanstack/react-query"
import { useParams, Link } from "react-router"
import { getAnalysis } from "../api/runs"

interface MetricCardProps {
  label: string
  value: number
  color: string
  delay: number
}

function MetricCard({ label, value, color, delay }: MetricCardProps) {
  return (
    <div 
      className="metric-card stagger-item"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="metric-bar-container">
        <div 
          className="metric-bar"
          style={{ 
            width: `${value * 100}%`,
            background: color 
          }}
        />
      </div>
      <div className="metric-info">
        <span className="metric-value" style={{ color }}>
          {(value * 100).toFixed(0)}%
        </span>
        <span className="metric-label">{label}</span>
      </div>

      <style>{`
        .metric-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          opacity: 0;
        }

        .metric-bar-container {
          height: 6px;
          background: var(--bg-page);
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: var(--space-3);
        }

        .metric-bar {
          height: 100%;
          border-radius: 3px;
          transition: width 0.6s ease-out;
        }

        .metric-info {
          display: flex;
          align-items: baseline;
          gap: var(--space-2);
        }

        .metric-value {
          font-size: var(--text-3xl);
          font-weight: 700;
          line-height: 1;
        }

        .metric-label {
          font-size: var(--text-sm);
          color: var(--text-secondary);
        }
      `}</style>
    </div>
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
        <Link to={`/runs/${runId}`} className="back-link">
          ← Back
        </Link>
        <div className="loading-container">
          <div className="loading-spinner" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container">
        <Link to={`/runs/${runId}`} className="back-link">
          ← Back
        </Link>
        <div className="error-state">
          <div className="error-state-title">Failed to load analysis</div>
          <div>{error instanceof Error ? error.message : "Unknown error"}</div>
        </div>
      </div>
    )
  }

  if (!analysis) {
    return null
  }

  return (
    <div className="page-container">
      <div className="animate-fade-in">
        <Link to={`/runs/${runId}`} className="back-link">
          ← Back to Run
        </Link>

        <h1 className="page-title">Analysis Report</h1>
      </div>

      <div className="metrics-grid stagger-item">
        <MetricCard 
          label="Engagement" 
          value={analysis.predicted_engagement} 
          color="var(--primary)"
          delay={0.1}
        />
        <MetricCard 
          label="Shareability" 
          value={analysis.predicted_shareability} 
          color="#8b5cf6"
          delay={0.15}
        />
        <MetricCard 
          label="Conversion" 
          value={analysis.predicted_conversion_signal} 
          color="var(--success)"
          delay={0.2}
        />
        <MetricCard 
          label="Trust" 
          value={analysis.predicted_trust} 
          color="var(--warning)"
          delay={0.25}
        />
      </div>

      <div className="analysis-sections">
        <div className="analysis-section stagger-item" style={{ animationDelay: "0.3s" }}>
          <h3 className="section-title">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="section-icon">
              <path d="M13 6L6 13L3 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Positive Themes
          </h3>
          <div className="theme-tags">
            {analysis.top_positive_themes.map((theme, i) => (
              <span key={i} className="theme-tag theme-positive">
                {theme}
              </span>
            ))}
          </div>
        </div>

        <div className="analysis-section stagger-item" style={{ animationDelay: "0.35s" }}>
          <h3 className="section-title">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="section-icon">
              <path d="M3 10L13 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Negative Themes
          </h3>
          <div className="theme-tags">
            {analysis.top_negative_themes.map((theme, i) => (
              <span key={i} className="theme-tag theme-negative">
                {theme}
              </span>
            ))}
          </div>
        </div>

        <div className="analysis-section stagger-item" style={{ animationDelay: "0.4s" }}>
          <h3 className="section-title">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="section-icon">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2"/>
              <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Objections
          </h3>
          <div className="theme-tags">
            {analysis.top_objections.map((obj, i) => (
              <span key={i} className="theme-tag theme-warning">
                {obj}
              </span>
            ))}
          </div>
        </div>

        {analysis.recommended_rewrite && (
          <div className="analysis-section rewrite-section stagger-item" style={{ animationDelay: "0.45s" }}>
            <h3 className="section-title">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="section-icon">
                <path d="M12 2L2 8l3 2 7-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5 14H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Recommended Rewrite
            </h3>
            <div className="rewrite-card">
              <p>{analysis.recommended_rewrite}</p>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: var(--space-4);
          margin: var(--space-6) 0;
        }

        @media (min-width: 768px) {
          .metrics-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .analysis-sections {
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
        }

        .analysis-section {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-lg);
          padding: var(--space-5);
          opacity: 0;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-base);
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: var(--space-4);
        }

        .section-icon {
          color: var(--text-tertiary);
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
          background: var(--success-bg);
          color: var(--success);
        }

        .theme-negative {
          background: var(--error-bg);
          color: var(--error);
        }

        .theme-warning {
          background: var(--warning-bg);
          color: var(--warning);
        }

        .rewrite-card {
          background: var(--primary-bg);
          border: 1px solid var(--primary);
          border-radius: var(--radius-md);
          padding: var(--space-4);
        }

        .rewrite-card p {
          color: var(--text-primary);
          line-height: 1.7;
        }
      `}</style>
    </div>
  )
}

export default AnalysisPage
