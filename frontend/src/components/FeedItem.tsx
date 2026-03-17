import { Link } from "react-router"
import type { FeedItem as FeedItemType } from "../types"

interface FeedItemProps {
  item: FeedItemType
  runId: string
}

const STANCE_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  supportive: {
    bg: "var(--success-subtle)",
    text: "var(--success)",
    accent: "var(--success)",
  },
  skeptical: {
    bg: "var(--warning-subtle)",
    text: "var(--warning)",
    accent: "var(--warning)",
  },
  neutral: {
    bg: "var(--bg-subtle)",
    text: "var(--text-tertiary)",
    accent: "var(--text-muted)",
  },
  critical: {
    bg: "var(--error-subtle)",
    text: "var(--error)",
    accent: "var(--error)",
  },
  curious: {
    bg: "var(--primary-subtle)",
    text: "var(--primary)",
    accent: "var(--primary)",
  },
}

function getInitials(handle: string): string {
  // Remove numbers and underscores, get first two chars
  const clean = handle.replace(/[_\d]/g, " ").trim()
  const parts = clean.split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return clean.slice(0, 2).toUpperCase()
}

function formatHandle(handle: string): string {
  return handle.startsWith("@") ? handle : `@${handle}`
}

function FeedItem({ item, runId }: FeedItemProps) {
  const stanceStyle = STANCE_COLORS[item.stance] || STANCE_COLORS.neutral

  return (
    <div className="fi-card" style={{ "--fi-accent": stanceStyle.accent } as React.CSSProperties}>
      <div className="fi-inner">
        {/* Avatar */}
        <Link to={`/runs/${runId}/agents/${item.author_agent_id}`} className="fi-avatar" style={{ background: stanceStyle.bg, color: stanceStyle.text }}>
          {getInitials(item.author_handle)}
        </Link>

        <div className="fi-body">
          {/* Header */}
          <div className="fi-header">
            <div className="fi-author">
              <Link to={`/runs/${runId}/agents/${item.author_agent_id}`} className="fi-handle">
                {formatHandle(item.author_handle)}
              </Link>
              <span className="fi-dot">&middot;</span>
              <span className="fi-persona">{item.author_display_name}</span>
            </div>
            <div className="fi-meta">
              <span
                className="fi-stance"
                style={{ background: stanceStyle.bg, color: stanceStyle.text }}
              >
                {item.stance}
              </span>
              <span className="fi-round">R{item.round_number}</span>
            </div>
          </div>

          {/* Content */}
          <p className="fi-content">{item.content}</p>

          {/* Footer */}
          <div className="fi-footer">
            <div className="fi-actions">
              <span className="fi-action">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {item.like_count}
              </span>
              <span className="fi-action">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {item.reply_count}
              </span>
            </div>

            {item.parent_post_id && (
              <Link to={`/runs/${runId}/threads/${item.post_id}`} className="fi-thread-link">
                View thread
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                  <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .fi-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          border-left: 3px solid var(--fi-accent, var(--border-default));
          transition: all var(--transition-base);
        }

        .fi-card:hover {
          border-color: var(--border-hover);
          border-left-color: var(--fi-accent, var(--border-hover));
          background: color-mix(in srgb, var(--bg-surface) 95%, var(--bg-elevated));
        }

        .fi-inner {
          display: flex;
          gap: var(--space-4);
          padding: var(--space-5);
        }

        /* Avatar */
        .fi-avatar {
          flex-shrink: 0;
          width: 38px;
          height: 38px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          font-family: var(--font-mono);
          letter-spacing: 0.02em;
          text-decoration: none;
          transition: transform var(--transition-fast);
        }

        .fi-avatar:hover {
          transform: scale(1.1);
        }

        /* Body */
        .fi-body {
          flex: 1;
          min-width: 0;
        }

        /* Header */
        .fi-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: var(--space-3);
          margin-bottom: var(--space-2);
          flex-wrap: wrap;
        }

        .fi-author {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          flex-wrap: wrap;
        }

        .fi-handle {
          font-weight: 600;
          font-size: var(--text-sm);
          color: var(--text-primary);
          text-decoration: none;
          transition: color var(--transition-fast);
        }

        .fi-handle:hover {
          color: var(--primary);
        }

        .fi-dot {
          color: var(--text-muted);
          font-size: var(--text-xs);
        }

        .fi-persona {
          font-size: var(--text-sm);
          color: var(--text-tertiary);
        }

        .fi-meta {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          flex-shrink: 0;
        }

        .fi-stance {
          font-size: 11px;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .fi-round {
          font-size: 11px;
          color: var(--text-muted);
          font-family: var(--font-mono);
          padding: 2px 6px;
          background: var(--bg-subtle);
          border-radius: var(--radius-sm);
        }

        /* Content */
        .fi-content {
          color: var(--text-secondary);
          font-size: var(--text-base);
          line-height: var(--leading-relaxed);
          margin: 0 0 var(--space-3) 0;
        }

        /* Footer */
        .fi-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .fi-actions {
          display: flex;
          gap: var(--space-4);
        }

        .fi-action {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: var(--text-xs);
          color: var(--text-muted);
          font-family: var(--font-mono);
          cursor: default;
          transition: color var(--transition-fast);
        }

        .fi-action:hover {
          color: var(--text-tertiary);
        }

        .fi-action svg {
          opacity: 0.6;
        }

        .fi-thread-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: var(--text-xs);
          font-weight: 600;
          color: var(--primary);
          text-decoration: none;
          transition: all var(--transition-fast);
        }

        .fi-thread-link:hover {
          color: var(--primary-hover);
        }

        .fi-thread-link:hover svg {
          transform: translateX(2px);
        }

        .fi-thread-link svg {
          transition: transform var(--transition-fast);
        }

        /* Responsive */
        @media (max-width: 640px) {
          .fi-inner {
            gap: var(--space-3);
            padding: var(--space-4);
          }

          .fi-avatar {
            width: 32px;
            height: 32px;
            font-size: 11px;
          }

          .fi-header {
            flex-direction: column;
            gap: var(--space-2);
          }
        }
      `}</style>
    </div>
  )
}

export default FeedItem
