import { useQuery } from "@tanstack/react-query"
import { useParams, Link } from "react-router"
import { getThread } from "../api/runs"

const STANCE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  supportive: { 
    bg: "var(--success-subtle)", 
    text: "var(--success)",
    border: "var(--success-glow)"
  },
  skeptical: { 
    bg: "var(--warning-subtle)", 
    text: "var(--warning)",
    border: "var(--warning-glow)"
  },
  neutral: { 
    bg: "var(--bg-subtle)", 
    text: "var(--text-tertiary)",
    border: "var(--border-subtle)"
  },
  critical: { 
    bg: "var(--error-subtle)", 
    text: "var(--error)",
    border: "var(--error-glow)"
  },
  curious: { 
    bg: "var(--primary-subtle)", 
    text: "var(--primary)",
    border: "var(--primary-glow)"
  },
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

function formatHandle(handle: string): string {
  return handle.startsWith("@") ? handle : `@${handle}`
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
            <span className="author-handle">{formatHandle(item.author_handle)}</span>
          </Link>
          <span 
            className="stance-tag"
            style={{ 
              background: stanceStyle.bg, 
              color: stanceStyle.text,
              borderColor: stanceStyle.border
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
          padding: var(--space-4) 0;
        }

        .thread-item-connector {
          position: absolute;
          left: -12px;
          top: 0;
          bottom: 0;
          width: 1px;
          background: var(--border-subtle);
        }

        .thread-item:first-child .thread-item-connector {
          top: 12px;
        }

        .thread-item-content {
          padding-left: var(--space-3);
        }

        .thread-item-header {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          margin-bottom: var(--space-3);
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
          letter-spacing: var(--tracking-wide);
          text-transform: uppercase;
          border: 1px solid transparent;
        }

        .round-badge {
          font-size: var(--text-xs);
          color: var(--text-muted);
          font-family: var(--font-mono);
        }

        .thread-text {
          color: var(--text-primary);
          line-height: var(--leading-relaxed);
          margin-bottom: var(--space-3);
        }

        .thread-stats {
          display: flex;
          gap: var(--space-4);
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          font-family: var(--font-mono);
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
      <div className="animate-reveal">
        <Link to={`/runs/${runId}/feed`} className="back-link">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Feed
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
        <div className="thread-container animate-scale">
          <ThreadItem item={thread.root} runId={runId!} />
        </div>
      )}

      <style>{`
        .thread-container {
          margin-top: var(--space-8);
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xl);
          padding: var(--space-6);
          box-shadow: var(--shadow-md);
        }
      `}</style>
    </div>
  )
}

export default ThreadPage
