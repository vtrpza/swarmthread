import { fetchApi } from './client'
import type {
  Run,
  RunCreate,
  FeedResponse,
  ThreadResponse,
  AgentResponse,
  AnalysisReport,
} from '../types'

export async function createRun(data: RunCreate): Promise<Run> {
  return fetchApi<Run>('/runs/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function getRun(runId: string): Promise<Run> {
  return fetchApi<Run>(`/runs/${runId}`)
}

export async function cancelRun(runId: string): Promise<Run> {
  return fetchApi<Run>(`/runs/${runId}/cancel`, {
    method: 'POST',
  })
}

export async function getFeed(runId: string): Promise<FeedResponse> {
  return fetchApi<FeedResponse>(`/runs/${runId}/feed`)
}

export async function getThread(
  runId: string,
  postId: string
): Promise<ThreadResponse> {
  return fetchApi<ThreadResponse>(`/runs/${runId}/threads/${postId}`)
}

export async function getAgent(
  runId: string,
  agentId: string
): Promise<AgentResponse> {
  return fetchApi<AgentResponse>(`/runs/${runId}/agents/${agentId}`)
}

export async function getAnalysis(runId: string): Promise<AnalysisReport> {
  return fetchApi<AnalysisReport>(`/runs/${runId}/analysis`)
}
