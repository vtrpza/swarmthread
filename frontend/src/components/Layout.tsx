import { Outlet, Link } from "react-router"

function Layout() {
  return (
    <>
      <header className="py-6 border-b border-[var(--border)]">
        <nav className="flex items-center justify-between max-w-4xl mx-auto px-4">
          <Link to="/" className="text-xl font-semibold text-[var(--text-h)]">
            SwarmThread
          </Link>
          <div className="flex gap-4">
            <Link
              to="/"
              className="text-[var(--text)] hover:text-[var(--text-h)] transition-colors"
            >
              New Run
            </Link>
          </div>
        </nav>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </>
  )
}

export default Layout
