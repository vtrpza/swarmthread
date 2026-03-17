import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cancelRun, getRun } from '../api/runs'
import type { RunStatus } from '../types'

const POLLING_STATUSES: RunStatus[] = ['queued', 'running']

export function useRun(runId: string) {
  return useQuery({
    queryKey: ['run', runId],
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
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => cancelRun(runId),
    onSuccess: (run) => {
      queryClient.setQueryData(['run', runId], run)
      void queryClient.invalidateQueries({ queryKey: ['run', runId] })
    },
  })
}
