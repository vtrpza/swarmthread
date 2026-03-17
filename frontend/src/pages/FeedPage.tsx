import { useParams, Link } from "react-router"
import { useFeed } from "../hooks/useFeed"
import FeedItem from "../components/FeedItem"

function FeedPage() {
  const { runId } = useParams()
  const { data: feed, isLoading, error } = useFeed(runId!)

  return (
    <div className="page-container">
      <div className="feed-header animate-fade-in">
        <Link to={`/runs/${runId}`} className="back-link">
          ← Back
        </Link>
        <h1 className="page-title">Feed</h1>
      </div>

      {isLoading && (
        <div className="loading-container">
          <div className="loading-spinner" />
        </div>
      )}

      {error && (
        <div className="error-state">
          <div className="error-state-title">Failed to load feed</div>
          <div>{error instanceof Error ? error.message : "Unknown error"}</div>
        </div>
      )}

      {feed && (
        <div className="feed-list">
          <div className="feed-count stagger-item">
            <span className="count-number">{feed.total}</span>
            <span className="count-label">posts</span>
          </div>
          <div className="feed-items">
            {feed.items.map((item, index) => (
              <div 
                key={item.post_id} 
                className="feed-item-wrapper stagger-item"
                style={{ animationDelay: `${0.05 * (index + 1)}s` }}
              >
                <FeedItem item={item} runId={runId!} />
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .feed-header {
          margin-bottom: var(--space-6);
        }

        .feed-header .page-title {
          margin-top: var(--space-2);
        }

        .feed-list {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          overflow: hidden;
        }

        .feed-count {
          padding: var(--space-4) var(--space-5);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: baseline;
          gap: var(--space-2);
        }

        .count-number {
          font-size: var(--text-2xl);
          font-weight: 600;
          color: var(--text-primary);
        }

        .count-label {
          font-size: var(--text-sm);
          color: var(--text-secondary);
        }

        .feed-items {
          max-height: 70vh;
          overflow-y: auto;
        }

        .feed-item-wrapper {
          border-bottom: 1px solid var(--border-color-light);
        }

        .feed-item-wrapper:last-child {
          border-bottom: none;
        }
      `}</style>
    </div>
  )
}

export default FeedPage
