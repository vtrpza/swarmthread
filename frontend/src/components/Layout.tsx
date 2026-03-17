import { Outlet, Link } from "react-router"

function Layout() {
  return (
    <>
      <header className="header">
        <nav className="header-nav">
          <Link to="/" className="header-logo">
            <img 
              src="/logo.png" 
              alt="SwarmThread" 
              className="header-logo-img"
            />
            <span className="header-logo-text">SwarmThread</span>
          </Link>
          <div className="header-links">
            <Link to="/" className="header-link">
              New Run
            </Link>
          </div>
        </nav>
      </header>
      <main className="main-content">
        <Outlet />
      </main>

      <style>{`
        .header {
          background: var(--bg-card);
          border-bottom: 1px solid var(--border-color);
          position: sticky;
          top: 0;
          z-index: 100;
          backdrop-filter: blur(8px);
          background: rgba(255, 255, 255, 0.9);
        }

        @media (prefers-color-scheme: dark) {
          .header {
            background: rgba(26, 26, 26, 0.9);
          }
        }

        .header-nav {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 var(--space-6);
          height: 60px;
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
        }

        .header-logo-img {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
        }

        .header-logo-text {
          font-size: var(--text-lg);
          font-weight: 600;
          letter-spacing: -0.3px;
        }

        .header-links {
          display: flex;
          align-items: center;
          gap: var(--space-4);
        }

        .header-link {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          text-decoration: none;
          padding: var(--space-2) var(--space-3);
          border-radius: var(--radius-md);
          transition: all 0.2s;
        }

        .header-link:hover {
          color: var(--primary);
          background: var(--primary-bg);
        }

        .main-content {
          flex: 1;
          min-height: calc(100vh - 60px);
        }
      `}</style>
    </>
  )
}

export default Layout
