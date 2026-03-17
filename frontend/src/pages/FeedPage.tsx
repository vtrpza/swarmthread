import { useParams, Link } from "react-router"
import { useFeed } from "../hooks/useFeed"
import FeedItem from "../components/FeedItem"

function FeedPage() {
  const { runId } = useParams()
  const { data: feed, isLoading, error } = useFeed(runId!)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="px-4 py-4 border-b border-[var(--border)] flex items-center gap-4">
        <Link
          to={`/runs/${runId}`}
          className="text-[var(--accent)] hover:underline"
        >
          ← Back
        </Link>
        <h1>Feed</h1>
      </div>

      {isLoading && (
        <div className="p-8 text-center text-[var(--text)]">Loading feed...</div>
      )}

      {error && (
        <div className="p-4 m-4 rounded bg-red-100 text-red-700">
          Failed to load feed: {error instanceof Error ? error.message : "Unknown error"}
        </div>
      )}

      {feed && (
        <>
          <div className="px-4 py-2 text-sm text-[var(--text)] border-b border-[var(--border)]">
            {feed.total} posts
          </div>
          <div>
            {feed.items.map((item) => (
              <FeedItem key={item.post_id} item={item} runId={runId!} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default FeedPage
