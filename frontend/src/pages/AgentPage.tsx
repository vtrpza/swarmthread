import { useQuery } from "@tanstack/react-query"
import { useParams, Link } from "react-router"
import { getAgent } from "../api/runs"

function formatHandle(handle: string): string {
  return handle.startsWith("@") ? handle : `@${handle}`
}

function AgentPage() {
  const { runId, agentId } = useParams()
  const { data: agent, isLoading, error } = useQuery({
    queryKey: ["agent", runId, agentId],
    queryFn: () => getAgent(runId!, agentId!),
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
      </div>

      {isLoading && (
        <div className="loading-container">
          <div className="loading-spinner" />
        </div>
      )}

      {error && (
        <div className="error-state">
          <div className="error-state-title">Failed to load agent</div>
          <div>{error instanceof Error ? error.message : "Unknown error"}</div>
        </div>
      )}

      {agent && (
        <div className="agent-profile animate-reveal">
          <div className="profile-header">
            <div className="profile-avatar">
              {agent.profile.handle.charAt(0).toUpperCase()}
            </div>
            <div className="profile-info">
              <h1 className="profile-handle">{formatHandle(agent.profile.handle)}</h1>
              <p className="profile-name">{agent.profile.display_name}</p>
            </div>
          </div>

          <div className="stat-grid stagger-item" style={{ animationDelay: "0.1s" }}>
            <div className="stat-card">
              <div className="stat-value">{agent.profile.post_count}</div>
              <div className="stat-label">Posts</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{agent.profile.reply_count}</div>
              <div className="stat-label">Replies</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{agent.profile.like_count}</div>
              <div className="stat-label">Likes</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{agent.profile.follow_count}</div>
              <div className="stat-label">Follows</div>
            </div>
          </div>

          <div className="profile-section" style={{ animationDelay: "0.2s" }}>
            <h3 className="section-title">Persona</h3>
            <div className="card persona-card">
              <div className="persona-name">{agent.profile.persona_name}</div>
              <p className="persona-desc">{agent.profile.persona_description}</p>
            </div>
          </div>

          <div className="profile-section" style={{ animationDelay: "0.3s" }}>
            <h3 className="section-title">Bias</h3>
            <div className="bias-tag">
              <span className="bias-label">Stance</span>
              <span className="bias-value">{agent.profile.stance_bias}</span>
            </div>
          </div>

          <div className="profile-section" style={{ animationDelay: "0.4s" }}>
            <h3 className="section-title">Recent Posts</h3>
            {agent.posts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-title">No posts yet</div>
              </div>
            ) : (
              <div className="posts-list">
                {agent.posts.slice(0, 10).map((post, index) => (
                  <div 
                    key={post.post_id} 
                    className="post-card"
                    style={{ animationDelay: `${0.05 * (index + 1)}s` }}
                  >
                    <p className="post-content">{post.content}</p>
                    <div className="post-meta">
                      <span className="post-stat">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                          <path d="M8 14s-5.5-3.5-5.5-7A3.5 3.5 0 018 4a3.5 3.5 0 015.5 3c0 3.5-5.5 7-5.5 7z" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                        {post.like_count}
                      </span>
                      <span className="post-stat">
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                          <path d="M14 9H4a1 1 0 01-1-1V3l6-2 6 2v5a1 1 0 01-1 1z" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                        {post.reply_count}
                      </span>
                      <span className="post-round">Round {post.round_number}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .agent-profile {
          margin-top: var(--space-8);
        }

        .profile-header {
          display: flex;
          align-items: center;
          gap: var(--space-5);
          margin-bottom: var(--space-8);
        }

        .profile-avatar {
          width: 80px;
          height: 80px;
          border-radius: var(--radius-xl);
          background: linear-gradient(135deg, var(--primary), var(--primary-active));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--text-3xl);
          font-weight: 600;
          font-family: var(--font-display);
          box-shadow: var(--shadow-glow-sm);
        }

        .profile-info {
          flex: 1;
        }

        .profile-handle {
          font-family: var(--font-display);
          font-size: var(--text-3xl);
          font-weight: 400;
          color: var(--text-primary);
        }

        .profile-name {
          font-size: var(--text-base);
          color: var(--text-secondary);
          margin-top: var(--space-1);
        }

        .profile-section {
          margin-bottom: var(--space-8);
          opacity: 0;
          animation: revealUp 0.5s ease-out forwards;
        }

        .persona-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
        }

        .persona-name {
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: var(--space-2);
          font-size: var(--text-lg);
        }

        .persona-desc {
          color: var(--text-secondary);
          font-size: var(--text-sm);
          line-height: var(--leading-relaxed);
          margin: 0;
        }

        .bias-tag {
          display: inline-flex;
          flex-direction: column;
          gap: 4px;
          padding: var(--space-3) var(--space-4);
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
        }

        .bias-label {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: var(--tracking-wider);
        }

        .bias-value {
          font-weight: 600;
          color: var(--text-primary);
        }

        .posts-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }

        .post-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-lg);
          padding: var(--space-4);
          opacity: 0;
          animation: revealUp 0.4s ease-out forwards;
          transition: all var(--transition-fast);
        }

        .post-card:hover {
          border-color: var(--border-hover);
        }

        .post-content {
          color: var(--text-primary);
          line-height: var(--leading-relaxed);
          margin-bottom: var(--space-3);
        }

        .post-meta {
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }

        .post-stat {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          font-family: var(--font-mono);
        }

        .post-round {
          font-size: var(--text-xs);
          color: var(--text-muted);
          margin-left: auto;
          font-family: var(--font-mono);
        }
      `}</style>
    </div>
  )
}

export default AgentPage
