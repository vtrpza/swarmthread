import { useQuery } from "@tanstack/react-query"
import { getRun, cancelRun } from "../api/runs"
import type { RunStatus } from "../types"

const POLLING_STATUSES: RunStatus[] = ["queued", "running"]

export function useRun(runId: string) {
  return useQuery({
    queryKey: ["run", runId],
    queryFn: () => getRun(runId),
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status && POLLING_STATUSES.includes(status)) {
        return 3000
      }
      return false
    },
  })
}

export function useCancelRun(runId: string) {
  return useQuery({
    queryKey: ["cancel-run", runId],
    queryFn: () => cancelRun(runId),
    enabled: false,
  })
}
