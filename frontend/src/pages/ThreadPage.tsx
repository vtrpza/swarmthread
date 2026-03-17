import { useQuery } from "@tanstack/react-query"
import { useParams, Link } from "react-router"
import { getThread } from "../api/runs"

const STANCE_COLORS: Record<string, { bg: string; text: string }> = {
  supportive: { bg: "var(--success-bg)", text: "var(--success)" },
  skeptical: { bg: "var(--warning-bg)", text: "var(--warning)" },
  neutral: { bg: "var(--bg-page)", text: "var(--text-secondary)" },
  critical: { bg: "var(--error-bg)", text: "var(--error)" },
  curious: { bg: "var(--primary-bg)", text: "var(--primary)" },
}

interface ThreadItemData {
  post_id: string
  author_handle: string
  author_agent_id: string
  content: string
  stance: string
  like_count: number
  reply_count: number
  round_number: number
  replies: ThreadItemData[]
}

interface ThreadItemProps {
  item: ThreadItemData
  runId: string
  depth?: number
}

function ThreadItem({ item, runId, depth = 0 }: ThreadItemProps) {
  const stanceStyle = STANCE_COLORS[item.stance] || STANCE_COLORS.neutral

  return (
    <div className="thread-item" style={{ marginLeft: depth * 24 }}>
      <div className="thread-item-connector" />
      <div className="thread-item-content">
        <div className="thread-item-header">
          <Link
            to={`/runs/${runId}/agents/${item.author_agent_id}`}
            className="author-link"
          >
            <span className="author-handle">@{item.author_handle}</span>
          </Link>
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
        <p className="thread-text">{item.content}</p>
        <div className="thread-stats">
          <span className="stat">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4a3.5 3.5 0 015.5 3c0 3.5-5.5 7-5.5 7z" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            {item.like_count}
          </span>
          <span className="stat">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M14 9H4a1 1 0 01-1-1V3l6-2 6 2v5a1 1 0 01-1 1z" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            {item.reply_count}
          </span>
        </div>
        {item.replies.map((reply) => (
          <ThreadItem key={reply.post_id} item={reply} runId={runId} depth={depth + 1} />
        ))}
      </div>

      <style>{`
        .thread-item {
          position: relative;
          padding: var(--space-3) 0;
        }

        .thread-item-connector {
          position: absolute;
          left: -12px;
          top: 0;
          bottom: 0;
          width: 2px;
          background: var(--border-color);
        }

        .thread-item:first-child .thread-item-connector {
          top: 8px;
        }

        .thread-item-content {
          padding-left: var(--space-2);
        }

        .thread-item-header {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-bottom: var(--space-2);
        }

        .author-link {
          text-decoration: none;
        }

        .author-handle {
          font-weight: 600;
          font-size: var(--text-sm);
          color: var(--text-primary);
        }

        .author-link:hover .author-handle {
          color: var(--primary);
        }

        .stance-tag {
          font-size: var(--text-xs);
          padding: 1px 6px;
          border-radius: var(--radius-sm);
          font-weight: 500;
        }

        .round-badge {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
        }

        .thread-text {
          color: var(--text-primary);
          line-height: 1.6;
          margin-bottom: var(--space-2);
        }

        .thread-stats {
          display: flex;
          gap: var(--space-3);
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: var(--text-xs);
          color: var(--text-tertiary);
        }
      `}</style>
    </div>
  )
}

function ThreadPage() {
  const { runId, postId } = useParams()
  const { data: thread, isLoading, error } = useQuery({
    queryKey: ["thread", runId, postId],
    queryFn: () => getThread(runId!, postId!),
  })

  return (
    <div className="page-container">
      <div className="animate-fade-in">
        <Link to={`/runs/${runId}/feed`} className="back-link">
          ← Back to Feed
        </Link>

        <h1 className="page-title" style={{ marginTop: "8px" }}>Thread</h1>
      </div>

      {isLoading && (
        <div className="loading-container">
          <div className="loading-spinner" />
        </div>
      )}

      {error && (
        <div className="error-state">
          <div className="error-state-title">Failed to load thread</div>
          <div>{error instanceof Error ? error.message : "Unknown error"}</div>
        </div>
      )}

      {thread && (
        <div className="thread-container animate-scale-in">
          <ThreadItem item={thread.root} runId={runId!} />
        </div>
      )}

      <style>{`
        .thread-container {
          margin-top: var(--space-6);
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          padding: var(--space-5);
        }
      `}</style>
    </div>
  )
}

export default ThreadPage
