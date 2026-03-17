import { useParams, Link } from "react-router"
import { useFeed } from "../hooks/useFeed"
import FeedItem from "../components/FeedItem"

function FeedPage() {
  const { runId } = useParams()
  const { data: feed, isLoading, error } = useFeed(runId!)

  return (
    <div className="page-container">
      {/* Header */}
      <div className="fp-header">
        <Link to={`/runs/${runId}`} className="rd-back">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Run
        </Link>

        <div className="fp-title-row">
          <div className="fp-title-group">
            <h1 className="fp-title">Feed</h1>
            {feed && (
              <span className="fp-count-badge">{feed.total}</span>
            )}
          </div>
          {feed && feed.total > 0 && (
            <div className="fp-subtitle">
              {(() => {
                const rounds = new Set(feed.items.map(i => i.round_number))
                const agents = new Set(feed.items.map(i => i.author_agent_id))
                return `${agents.size} agents across ${rounds.size} round${rounds.size !== 1 ? "s" : ""}`
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="fp-loading">
          <div className="loading-spinner" />
          <span className="fp-loading-text">Loading posts...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rd-error">
          <div className="rd-error-header">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M8 5v3.5M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Failed to load feed
          </div>
          <div className="rd-error-message">
            {error instanceof Error ? error.message : "Unknown error"}
          </div>
        </div>
      )}

      {/* Empty */}
      {feed && feed.items.length === 0 && (
        <div className="fp-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" opacity="0.25">
            <path d="M4 6h16M4 12h10M4 18h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <div className="fp-empty-title">No posts yet</div>
          <div className="fp-empty-desc">Posts will appear here as agents interact</div>
        </div>
      )}

      {/* Feed Items */}
      {feed && feed.items.length > 0 && (
        <div className="fp-feed">
          {feed.items.map((item, index) => (
            <div
              key={item.post_id}
              style={{ animation: `revealUp 0.35s cubic-bezier(0.4, 0, 0.2, 1) ${Math.min(index * 0.04, 0.6)}s both` }}
            >
              <FeedItem item={item} runId={runId!} />
            </div>
          ))}
        </div>
      )}

      <style>{`
        .fp-header {
          margin-bottom: var(--space-6);
          animation: revealUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) both;
        }

        .fp-title-row {
          margin-top: var(--space-4);
        }

        .fp-title-group {
          display: flex;
          align-items: center;
          gap: var(--space-3);
        }

        .fp-title {
          font-family: var(--font-display);
          font-size: var(--text-3xl);
          font-weight: 400;
          color: var(--text-primary);
          margin: 0;
        }

        .fp-count-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 28px;
          height: 28px;
          padding: 0 8px;
          background: var(--primary-subtle);
          color: var(--primary);
          font-family: var(--font-mono);
          font-size: var(--text-sm);
          font-weight: 600;
          border-radius: var(--radius-full);
        }

        .fp-subtitle {
          margin-top: var(--space-1);
          font-size: var(--text-sm);
          color: var(--text-tertiary);
        }

        .fp-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-16);
        }

        .fp-loading-text {
          font-size: var(--text-sm);
          color: var(--text-tertiary);
        }

        .fp-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-16) var(--space-6);
          text-align: center;
        }

        .fp-empty-title {
          font-family: var(--font-display);
          font-size: var(--text-xl);
          color: var(--text-secondary);
        }

        .fp-empty-desc {
          font-size: var(--text-sm);
          color: var(--text-muted);
        }

        .fp-feed {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        /* Reuse rd-back from RunDetailPage */
        .rd-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: var(--text-sm);
          color: var(--text-tertiary);
          font-family: var(--font-body);
          font-weight: 500;
          letter-spacing: var(--tracking-wide);
          transition: color var(--transition-fast);
          text-decoration: none;
        }
        .rd-back:hover {
          color: var(--primary);
        }
      `}</style>
    </div>
  )
}

export default FeedPage
