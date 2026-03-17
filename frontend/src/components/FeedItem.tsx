import { Link } from "react-router"
import type { FeedItem as FeedItemType } from "../types"

interface FeedItemProps {
  item: FeedItemType
  runId: string
}

const STANCE_COLORS: Record<string, { bg: string; text: string }> = {
  supportive: { bg: "var(--success-bg)", text: "var(--success)" },
  skeptical: { bg: "var(--warning-bg)", text: "var(--warning)" },
  neutral: { bg: "var(--bg-page)", text: "var(--text-secondary)" },
  critical: { bg: "var(--error-bg)", text: "var(--error)" },
  curious: { bg: "var(--primary-bg)", text: "var(--primary)" },
}

function FeedItem({ item, runId }: FeedItemProps) {
  const stanceStyle = STANCE_COLORS[item.stance] || STANCE_COLORS.neutral

  return (
    <div className="feed-item">
      <div className="feed-item-header">
        <Link
          to={`/runs/${runId}/agents/${item.author_agent_id}`}
          className="author-link"
        >
          <span className="author-handle">@{item.author_handle}</span>
        </Link>
        <span className="author-name">{item.author_display_name}</span>
        <span 
          className="stance-tag"
          style={{ 
            background: stanceStyle.bg, 
            color: stanceStyle.text 
          }}
        >
          {item.stance}
        </span>
        <span className="round-badge">R{item.round_number}</span>
      </div>
      
      <p className="feed-item-content">{item.content}</p>
      
      <div className="feed-item-footer">
        <div className="feed-stats">
          <span className="stat">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4a3.5 3.5 0 015.5 3c0 3.5-5.5 7-5.5 7z" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            {item.like_count}
          </span>
          <span className="stat">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M14 9H4a1 1 0 01-1-1V3l6-2 6 2v5a1 1 0 01-1 1z" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M4 7h8" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            {item.reply_count}
          </span>
        </div>
        {item.parent_post_id && (
          <Link
            to={`/runs/${runId}/threads/${item.post_id}`}
            className="thread-link"
          >
            View thread →
          </Link>
        )}
      </div>

      <style>{`
        .feed-item {
          padding: var(--space-4) var(--space-5);
          transition: background 0.2s;
        }

        .feed-item:hover {
          background: var(--bg-page);
        }

        .feed-item-header {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-bottom: var(--space-2);
          flex-wrap: wrap;
        }

        .author-link {
          text-decoration: none;
        }

        .author-handle {
          font-weight: 600;
          color: var(--text-primary);
        }

        .author-link:hover .author-handle {
          color: var(--primary);
        }

        .author-name {
          font-size: var(--text-sm);
          color: var(--text-tertiary);
        }

        .stance-tag {
          font-size: var(--text-xs);
          padding: 2px 8px;
          border-radius: var(--radius-sm);
          font-weight: 500;
        }

        .round-badge {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          padding: 2px 6px;
          background: var(--bg-page);
          border-radius: var(--radius-sm);
        }

        .feed-item-content {
          color: var(--text-primary);
          line-height: 1.6;
          margin-bottom: var(--space-3);
        }

        .feed-item-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-3);
        }

        .feed-stats {
          display: flex;
          gap: var(--space-4);
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: var(--text-sm);
          color: var(--text-tertiary);
        }

        .stat svg {
          opacity: 0.6;
        }

        .thread-link {
          font-size: var(--text-sm);
          color: var(--primary);
        }

        .thread-link:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}

export default FeedItem
