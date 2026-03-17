import type { UserRunList } from '../types/user'
import { fetchApi } from './client'

export async function createUser(userId?: string): Promise<{ id: string; created_at: string }> {
  return fetchApi<{ id: string; created_at: string }>('/users/', {
    method: 'POST',
    body: JSON.stringify({ id: userId }),
  })
}

export async function getUserRuns(
  limit: number = 50,
  offset: number = 0
): Promise<UserRunList[]> {
  return fetchApi<UserRunList[]>(
    `/users/me/runs?limit=${limit}&offset=${offset}`
  )
}