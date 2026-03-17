import { useQuery } from "@tanstack/react-query"
import { getFeed } from "../api/runs"

export function useFeed(runId: string) {
  return useQuery({
    queryKey: ["feed", runId],
    queryFn: () => getFeed(runId),
    refetchInterval: (query) => {
      const data = query.state.data
      if (data && data.items.length > 0) {
        return 5000
      }
      return false
    },
  })
}
