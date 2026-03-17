import { fetchApi } from './client'

export interface ModelInfo {
  id: string
  name: string
  context_length: number | null
  pricing: Record<string, number> | null
}

export interface ValidateKeyResponse {
  valid: boolean
  error: string | null
}

export async function listModels(): Promise<ModelInfo[]> {
  return fetchApi<ModelInfo[]>('/models/')
}

export async function validateApiKey(): Promise<ValidateKeyResponse> {
  return fetchApi<ValidateKeyResponse>('/models/validate-key', {
    method: 'POST',
  })
}