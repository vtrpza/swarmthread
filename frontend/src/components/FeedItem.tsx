import { Link } from "react-router"
import type { FeedItem as FeedItemType } from "../types"

interface FeedItemProps {
  item: FeedItemType
  runId: string
}

const STANCE_COLORS: Record<string, string> = {
  supportive: "bg-green-100 text-green-800",
  skeptical: "bg-orange-100 text-orange-800",
  neutral: "bg-gray-100 text-gray-800",
  critical: "bg-red-100 text-red-800",
  curious: "bg-blue-100 text-blue-800",
}

function FeedItem({ item, runId }: FeedItemProps) {
  return (
    <div className="p-4 border-b border-[var(--border)]">
      <div className="flex items-center gap-2 mb-2">
        <Link
          to={`/runs/${runId}/agents/${item.author_agent_id}`}
          className="font-medium text-[var(--text-h)] hover:text-[var(--accent)]"
        >
          @{item.author_handle}
        </Link>
        <span className="text-sm text-[var(--text)]">
          {item.author_display_name}
        </span>
        <span
          className={`px-2 py-0.5 rounded text-xs ${
            STANCE_COLORS[item.stance] || "bg-gray-100"
          }`}
        >
          {item.stance}
        </span>
        <span className="text-xs text-[var(--text)]">R{item.round_number}</span>
      </div>
      <p className="text-[var(--text-h)] mb-2">{item.content}</p>
      <div className="flex gap-4 text-sm text-[var(--text)]">
        <span>❤️ {item.like_count}</span>
        <span>💬 {item.reply_count}</span>
        {item.parent_post_id && (
          <Link
            to={`/runs/${runId}/threads/${item.post_id}`}
            className="hover:text-[var(--accent)]"
          >
            View thread
          </Link>
        )}
      </div>
    </div>
  )
}

export default FeedItem
