import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import { getAgent } from '../api/runs'
import { formatDateTime, formatHandle, pluralize } from '../utils/formatters'
import './AgentPage.css'

function getAvatarLabel(handle: string): string {
  const cleaned = handle.replace(/[_\d]+/g, ' ').trim()
  const parts = cleaned.split(/\s+/).filter(Boolean)

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }

  return cleaned.slice(0, 2).toUpperCase()
}

function AgentPage() {
  const { runId, agentId } = useParams()
  const resolvedRunId = runId ?? ''
  const resolvedAgentId = agentId ?? ''

  const { data: agent, isLoading, error } = useQuery({
    queryKey: ['agent', resolvedRunId, resolvedAgentId],
    queryFn: () => getAgent(resolvedRunId, resolvedAgentId),
  })

  return (
    <div className="page-container page-container-wide agent-page">
      <div className="animate-reveal">
        <Link to={`/runs/${resolvedRunId}/feed`} className="back-link">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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

      {isLoading && (
        <div className="loading-container">
          <div className="loading-spinner" />
        </div>
      )}

      {error && (
        <div className="error-state">
          <div className="error-state-title">Failed to load agent</div>
          <div>{error instanceof Error ? error.message : 'Unknown error'}</div>
        </div>
      )}

      {agent && (
        <>
          <section className="agent-hero card card-elevated animate-scale">
            <div className="agent-identity">
              <div className="agent-avatar">{getAvatarLabel(agent.profile.handle)}</div>
              <div className="agent-identity-copy">
                <span className="agent-eyebrow">Simulated profile</span>
                <h1 className="page-title agent-handle">
                  {formatHandle(agent.profile.handle)}
                </h1>
                <p className="agent-name">{agent.profile.display_name}</p>
                <div className="agent-badges">
                  <span className="agent-badge agent-badge-primary">
                    {agent.profile.persona_name}
                  </span>
                  <span className="agent-badge agent-badge-neutral">
                    {agent.profile.stance_bias}
                  </span>
                  <span className="agent-badge agent-badge-neutral">
                    Created {formatDateTime(agent.profile.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="agent-stat-grid">
              <article className="agent-stat-card">
                <span className="agent-stat-label">Posts</span>
                <strong>{agent.profile.post_count}</strong>
              </article>
              <article className="agent-stat-card">
                <span className="agent-stat-label">Replies</span>
                <strong>{agent.profile.reply_count}</strong>
              </article>
              <article className="agent-stat-card">
                <span className="agent-stat-label">Likes</span>
                <strong>{agent.profile.like_count}</strong>
              </article>
              <article className="agent-stat-card">
                <span className="agent-stat-label">Follows</span>
                <strong>{agent.profile.follow_count}</strong>
              </article>
            </div>
          </section>

          <div className="agent-layout">
            <section className="card agent-panel">
              <div className="agent-panel-header">
                <span className="agent-eyebrow">Persona</span>
                <h2 className="agent-panel-title">Voice Profile</h2>
              </div>
              <p className="agent-panel-lead">{agent.profile.persona_name}</p>
              <p className="agent-panel-copy">{agent.profile.persona_description}</p>
            </section>

            <section className="card agent-panel">
              <div className="agent-panel-header">
                <span className="agent-eyebrow">Bias</span>
                <h2 className="agent-panel-title">Reaction Tendency</h2>
              </div>
              <p className="agent-panel-copy">
                This agent tends to respond from a{' '}
                <strong>{agent.profile.stance_bias}</strong> perspective when reacting to
                campaign messaging.
              </p>
            </section>

            <section className="card agent-activity">
              <div className="agent-panel-header">
                <span className="agent-eyebrow">Activity</span>
                <h2 className="agent-panel-title">Recent Posts</h2>
              </div>
              <p className="agent-activity-summary">
                Showing the latest {Math.min(agent.posts.length, 10)} items from this
                profile. {pluralize(agent.profile.reply_count, 'reply')} and{' '}
                {pluralize(agent.profile.post_count, 'post')} produced in the run.
              </p>

              {agent.posts.length === 0 ? (
                <div className="empty-state agent-empty-state">
                  <div className="empty-state-title">No posts yet</div>
                  <div className="empty-state-description">
                    This agent did not publish during the simulated run.
                  </div>
                </div>
              ) : (
                <div className="agent-post-list">
                  {agent.posts.slice(0, 10).map((post) => (
                    <article key={post.post_id} className="agent-post-card">
                      <div className="agent-post-topline">
                        <div className="agent-post-meta">
                          <span className="agent-post-round">Round {post.round_number}</span>
                          <span className="agent-post-type">
                            {post.parent_post_id ? 'Reply' : 'Original post'}
                          </span>
                          <span className="agent-post-stance">{post.stance}</span>
                        </div>
                        <span className="agent-post-time">
                          {formatDateTime(post.created_at)}
                        </span>
                      </div>

                      <p className="agent-post-content">{post.content}</p>

                      <div className="agent-post-footer">
                        <div className="agent-post-stats">
                          <span className="agent-post-stat">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 16 16"
                              fill="none"
                              aria-hidden="true"
                            >
                              <path
                                d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4a3.5 3.5 0 015.5 3c0 3.5-5.5 7-5.5 7z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              />
                            </svg>
                            {post.like_count}
                          </span>
                          <span className="agent-post-stat">
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 16 16"
                              fill="none"
                              aria-hidden="true"
                            >
                              <path
                                d="M14 9H4a1 1 0 01-1-1V3l6-2 6 2v5a1 1 0 01-1 1z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              />
                            </svg>
                            {pluralize(post.reply_count, 'reply')}
                          </span>
                        </div>

                        {post.parent_post_id && (
                          <Link
                            to={`/runs/${resolvedRunId}/threads/${post.post_id}`}
                            className="agent-post-thread-link"
                          >
                            View thread
                          </Link>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  )
}

export default AgentPage
