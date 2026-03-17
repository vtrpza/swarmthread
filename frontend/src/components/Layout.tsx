import { Outlet, Link } from "react-router"
import { useUserSettings } from "../hooks/useUserSettings"

function Layout() {
  const { hasApiKey } = useUserSettings()

  return (
    <>
      <header className="header">
        <nav className="header-nav">
          <Link to="/" className="header-logo">
            <div className="header-logo-mark">
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="3" fill="var(--primary)"/>
                <circle cx="8" cy="8" r="2" fill="var(--text-tertiary)"/>
                <circle cx="24" cy="8" r="2" fill="var(--text-tertiary)"/>
                <circle cx="8" cy="24" r="2" fill="var(--text-tertiary)"/>
                <circle cx="24" cy="24" r="2" fill="var(--text-tertiary)"/>
                <line x1="10" y1="10" x2="14" y2="14" stroke="var(--border-default)" strokeWidth="1"/>
                <line x1="22" y1="10" x2="18" y2="14" stroke="var(--border-default)" strokeWidth="1"/>
                <line x1="10" y1="22" x2="14" y2="18" stroke="var(--border-default)" strokeWidth="1"/>
                <line x1="22" y1="22" x2="18" y2="18" stroke="var(--border-default)" strokeWidth="1"/>
              </svg>
            </div>
            <span className="header-logo-text">SwarmThread</span>
          </Link>
          <div className="header-links">
            <Link to="/" className="header-link">
              New Simulation
            </Link>
            <Link to="/history" className="header-link">
              History
            </Link>
            <Link to="/settings" className="header-link header-link-settings">
              {hasApiKey ? (
                <span className="settings-status settings-status-ok">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Settings
                </span>
              ) : (
                <span className="settings-status settings-status-warning">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  Setup Required
                </span>
              )}
            </Link>
          </div>
        </nav>
      </header>
      <main className="main-content">
        <Outlet />
      </main>

      <style>{`
        .header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: var(--z-sticky);
          background: rgba(10, 10, 15, 0.8);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border-subtle);
        }

        .header-nav {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 var(--space-6);
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-logo {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          text-decoration: none;
          color: var(--text-primary);
          transition: opacity var(--transition-fast);
        }

        .header-logo:hover {
          opacity: 0.8;
        }

        .header-logo-mark {
          width: 32px;
          height: 32px;
        }

        .header-logo-mark svg {
          width: 100%;
          height: 100%;
        }

        .header-logo-text {
          font-family: var(--font-display);
          font-size: var(--text-xl);
          font-weight: 400;
          letter-spacing: -0.01em;
        }

        .header-links {
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }

        .header-link {
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--text-secondary);
          text-decoration: none;
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-md);
          transition: all var(--transition-base);
          letter-spacing: var(--tracking-wide);
        }

        .header-link:hover {
          color: var(--text-primary);
          background: var(--bg-subtle);
        }

        .header-link-settings {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .settings-status {
          display: flex;
          align-items: center;
          gap: var(--space-1);
        }

        .settings-status svg {
          width: 16px;
          height: 16px;
        }

        .settings-status-ok {
          color: var(--success);
        }

        .settings-status-warning {
          color: var(--warning);
        }

        .main-content {
          flex: 1;
          min-height: 100vh;
          padding-top: 72px;
        }

        @media (max-width: 640px) {
          .header-nav {
            padding: 0 var(--space-4);
            height: 64px;
          }

          .header-logo-text {
            font-size: var(--text-lg);
          }

          .main-content {
            padding-top: 64px;
          }
        }
      `}</style>
    </>
  )
}

export default Layout
