const API_BASE = '/api'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

function getUserHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const userId = localStorage.getItem('swarmthread:user-id')
  const apiKey = localStorage.getItem('swarmthread:api-key')
  const headers: Record<string, string> = {}
  if (userId) {
    headers['X-User-ID'] = userId
  }
  if (apiKey) {
    headers['X-OpenRouter-Key'] = apiKey
  }
  return headers
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...getUserHeaders(),
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const detail = await response.json().catch(() => ({}))
    throw new ApiError(
      response.status,
      detail.detail || `HTTP ${response.status}`
    )
  }

  return response.json()
}
