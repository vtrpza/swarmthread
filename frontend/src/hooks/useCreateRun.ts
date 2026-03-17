import { useMutation } from "@tanstack/react-query"
import { createRun } from "../api/runs"
import type { RunCreate } from "../types"

export function useCreateRun() {
  return useMutation({
    mutationFn: (data: RunCreate) => createRun(data),
  })
}
