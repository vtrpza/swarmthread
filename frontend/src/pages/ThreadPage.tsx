import { useMemo, type CSSProperties } from "react"
import { useQuery } from "@tanstack/react-query"
import { Link, useParams } from "react-router"
import { getThread } from "../api/runs"
import { formatDateTime, formatHandle, pluralize } from "../utils/formatters"
import type { ThreadItem as ThreadItemData } from "../types"
import "./ThreadPage.css"

const STANCE_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  supportive: {
    bg: "var(--success-subtle)",
    text: "var(--success)",
    border: "var(--success-glow)",
    glow: "var(--success-glow)",
  },
  skeptical: {
    bg: "var(--warning-subtle)",
    text: "var(--warning)",
    border: "var(--warning-glow)",
    glow: "var(--warning-glow)",
  },
  neutral: {
    bg: "var(--bg-subtle)",
    text: "var(--text-secondary)",
    border: "var(--border-subtle)",
    glow: "var(--border-subtle)",
  },
  critical: {
    bg: "var(--error-subtle)",
    text: "var(--error)",
    border: "var(--error-glow)",
    glow: "var(--error-glow)",
  },
  curious: {
    bg: "var(--primary-subtle)",
    text: "var(--primary)",
    border: "var(--primary-glow)",
    glow: "var(--primary-glow)",
  },
}

interface ThreadSummary {
  totalPosts: number
  totalReplies: number
  totalLikes: number
  maxDepth: number
}

function summarizeThread(root: ThreadItemData): ThreadSummary {
  const summary: ThreadSummary = {
    totalPosts: 0,
    totalReplies: 0,
    totalLikes: 0,
    maxDepth: 0,
  }

  const visitNode = (node: ThreadItemData, depth: number) => {
    summary.totalPosts += 1
    summary.totalLikes += node.like_count
    summary.maxDepth = Math.max(summary.maxDepth, depth)

    node.replies.forEach((reply) => {
      summary.totalReplies += 1
      visitNode(reply, depth + 1)
    })
  }

  visitNode(root, 0)
  return summary
}

interface ThreadNodeProps {
  item: ThreadItemData
  runId: string
  depth?: number
}

function ThreadNode({ item, runId, depth = 0 }: ThreadNodeProps) {
  const stanceStyle = STANCE_COLORS[item.stance] ?? STANCE_COLORS.neutral

  return (
    <article
      className={`thread-node ${depth === 0 ? "thread-node-root" : ""}`}
      style={{ "--thread-depth": depth } as CSSProperties}
    >
      <div className="thread-node-card">
        {/* Connector line for nested items */}
        {depth > 0 && (
          <div className="thread-node-connector">
            <div
              className="thread-node-connector-line"
              style={{ background: stanceStyle.glow }}
            />
          </div>
        )}

        <div className="thread-node-header">
          <div className="thread-node-author-block">
            <Link
              to={`/runs/${runId}/agents/${item.author_agent_id}`}
              className="thread-node-author"
            >
              <span className="thread-node-author-avatar">
                {item.author_handle.charAt(0).toUpperCase()}
              </span>
              <span className="thread-node-author-name">
                {formatHandle(item.author_handle)}
              </span>
            </Link>
            <span
              className="thread-node-stance"
              style={{
                background: stanceStyle.bg,
                color: stanceStyle.text,
                borderColor: stanceStyle.border,
              }}
            >
              {item.stance}
            </span>
            <span className="thread-node-round">Round {item.round_number}</span>
          </div>
          <span className="thread-node-time">{formatDateTime(item.created_at)}</span>
        </div>

        <p className="thread-node-content">{item.content}</p>

        <div className="thread-node-footer">
          <button className="thread-node-action" aria-label="Like post">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4a3.5 3.5 0 015.5 3c0 3.5-5.5 7-5.5 7z"
                stroke="currentColor"
                strokeWidth="1.5"
                fill={item.like_count > 0 ? "currentColor" : "none"}
                className={item.like_count > 0 ? "liked" : ""}
              />
            </svg>
            <span className="thread-node-action-count">{item.like_count}</span>
          </button>

          <button className="thread-node-action" aria-label="View replies">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M14 9H4a1 1 0 01-1-1V3l6-2 6 2v5a1 1 0 01-1 1z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M4 9v4l4-2 4 2V9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="thread-node-action-count">
              {pluralize(item.reply_count, "reply")}
            </span>
          </button>
        </div>
      </div>

      {item.replies.length > 0 && (
        <div className="thread-node-children">
          {item.replies.map((reply) => (
            <ThreadNode
              key={reply.post_id}
              item={reply}
              runId={runId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </article>
  )
}

export default function ThreadPage() {
  const { runId, postId } = useParams()
  const resolvedRunId = runId ?? ""
  const resolvedPostId = postId ?? ""

  const { data: thread, isLoading, error } = useQuery({
    queryKey: ["thread", resolvedRunId, resolvedPostId],
    queryFn: () => getThread(resolvedRunId, resolvedPostId),
  })

  const summary = useMemo(() => {
    if (!thread) {
      return null
    }

    return summarizeThread(thread.root)
  }, [thread])

  return (
    <main className="thread-page">
      <div className="thread-page-container">
        {/* Header Section */}
        <header className="thread-page-header animate-reveal">
          <div className="thread-page-breadcrumb">
            <Link to={`/runs/${resolvedRunId}/feed`} className="breadcrumb-link">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M10 12L6 8l4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Back to Feed
            </Link>
          </div>

          <div className="thread-page-title-section">
            <span className="thread-page-eyebrow">Conversation Thread</span>
            <h1 className="thread-page-title">
              Thread by {thread ? formatHandle(thread.root.author_handle) : "Unknown"}
            </h1>
            <p className="thread-page-subtitle">
              {summary
                ? `Exploring ${pluralize(summary.totalReplies, "reply")} across ${summary.maxDepth + 1} conversation levels`
                : "Loading conversation details..."}
            </p>
          </div>
        </header>

        {/* Loading State */}
        {isLoading && (
          <div className="thread-page-content animate-scale">
            <div className="loading-state">
              <div className="loading-spinner" />
              <span className="loading-text">Loading thread...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="thread-page-content animate-scale">
            <div className="error-state card card-elevated">
              <div className="error-state-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 8v5M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div className="error-state-title">Failed to load thread</div>
              <div className="error-state-message">
                {error instanceof Error ? error.message : "Unknown error"}
              </div>
              <button
                className="btn btn-primary"
                onClick={() => window.location.reload()}
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {thread && summary && (
          <>
            {/* Summary Card */}
            <section className="thread-summary card card-elevated animate-scale">
              <div className="thread-summary-main">
                <div className="thread-summary-header">
                  <div className="thread-summary-author">
                    <span className="thread-summary-avatar">
                      {thread.root.author_handle.charAt(0).toUpperCase()}
                    </span>
                    <div className="thread-summary-author-info">
                      <span className="thread-summary-author-name">
                        {formatHandle(thread.root.author_handle)}
                      </span>
                      <span className="thread-summary-author-meta">
                        Round {thread.root.round_number}
                      </span>
                    </div>
                  </div>
                  <span
                    className="thread-summary-stance"
                    style={{
                      background: STANCE_COLORS[thread.root.stance]?.bg ?? STANCE_COLORS.neutral.bg,
                      color: STANCE_COLORS[thread.root.stance]?.text ?? STANCE_COLORS.neutral.text,
                      borderColor: STANCE_COLORS[thread.root.stance]?.border ?? STANCE_COLORS.neutral.border,
                    }}
                  >
                    {thread.root.stance}
                  </span>
                </div>

                <blockquote className="thread-summary-content">
                  "{thread.root.content}"
                </blockquote>

                <div className="thread-summary-meta">
                  <span className="thread-summary-time">
                    {formatDateTime(thread.root.created_at)}
                  </span>
                </div>
              </div>

              <div className="thread-summary-stats">
                <div className="thread-summary-stat">
                  <span className="thread-summary-stat-value">{summary.totalPosts}</span>
                  <span className="thread-summary-stat-label">Total Posts</span>
                </div>
                <div className="thread-summary-stat">
                  <span className="thread-summary-stat-value">{summary.totalReplies}</span>
                  <span className="thread-summary-stat-label">Replies</span>
                </div>
                <div className="thread-summary-stat">
                  <span className="thread-summary-stat-value">{summary.totalLikes}</span>
                  <span className="thread-summary-stat-label">Likes</span>
                </div>
                <div className="thread-summary-stat">
                  <span className="thread-summary-stat-value">{summary.maxDepth + 1}</span>
                  <span className="thread-summary-stat-label">Depth</span>
                </div>
              </div>
            </section>

            {/* Thread Tree */}
            <section className="thread-tree-section animate-scale">
              <div className="thread-tree-header">
                <h2 className="thread-tree-title">Conversation</h2>
                <span className="thread-tree-count">
                  {summary.totalPosts} posts
                </span>
              </div>

              <div className="thread-tree">
                <ThreadNode item={thread.root} runId={resolvedRunId} />
              </div>
            </section>

            {/* Empty State */}
            {thread.root.replies.length === 0 && (
              <div className="empty-state card animate-scale">
                <div className="empty-state-icon">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M8 10h8M8 14h4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <h3 className="empty-state-title">No replies yet</h3>
                <p className="empty-state-description">
                  This post did not branch into a conversation in the simulated feed.
                  The root post stands alone.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
