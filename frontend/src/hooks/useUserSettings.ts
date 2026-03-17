import { useState, useEffect, useCallback } from "react"

const USER_ID_KEY = "swarmthread:user-id"
const API_KEY_KEY = "swarmthread:api-key"
const DEFAULT_MODEL_KEY = "swarmthread:default-model"

function setStoredValue<T>(key: string, value: T): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage errors
  }
}

export function generateUserId(): string {
  return crypto.randomUUID()
}

export function getUserId(): string {
  const stored = localStorage.getItem(USER_ID_KEY)
  if (stored) return stored
  const newId = generateUserId()
  localStorage.setItem(USER_ID_KEY, newId)
  return newId
}

export function getApiKey(): string | null {
  return localStorage.getItem(API_KEY_KEY)
}

export function getDefaultModel(): string {
  return localStorage.getItem(DEFAULT_MODEL_KEY) || "qwen/qwen-plus"
}

export function setApiKey(key: string): void {
  localStorage.setItem(API_KEY_KEY, key)
}

export function setDefaultModel(model: string): void {
  localStorage.setItem(DEFAULT_MODEL_KEY, model)
}

export function clearApiKey(): void {
  localStorage.removeItem(API_KEY_KEY)
}

export function clearUserData(): void {
  localStorage.removeItem(USER_ID_KEY)
  localStorage.removeItem(API_KEY_KEY)
  localStorage.removeItem(DEFAULT_MODEL_KEY)
}

export interface UserSettings {
  userId: string
  apiKey: string | null
  defaultModel: string
  hasApiKey: boolean
  setApiKey: (key: string) => void
  setDefaultModel: (model: string) => void
  clearApiKey: () => void
  clearUserData: () => void
}

export function useUserSettings(): UserSettings {
  const [userId] = useState<string>(() => {
    if (typeof window === "undefined") return ""
    return getUserId()
  })
  const [apiKey, setApiKeyState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null
    return getApiKey()
  })
  const [defaultModel, setDefaultModelState] = useState<string>(() => {
    if (typeof window === "undefined") return "qwen/qwen-plus"
    return getDefaultModel()
  })

  const handleSetApiKey = useCallback((key: string) => {
    setApiKey(key)
    setApiKeyState(key)
  }, [])

  const handleSetDefaultModel = useCallback((model: string) => {
    setDefaultModel(model)
    setDefaultModelState(model)
  }, [])

  const handleClearApiKey = useCallback(() => {
    clearApiKey()
    setApiKeyState(null)
  }, [])

  const handleClearUserData = useCallback(() => {
    clearUserData()
    const newId = generateUserId()
    localStorage.setItem(USER_ID_KEY, newId)
    setApiKeyState(null)
    setDefaultModelState("qwen/qwen-plus")
  }, [])

  useEffect(() => {
    // Sync to localStorage on changes
    if (apiKey) {
      setStoredValue(API_KEY_KEY, apiKey)
    }
  }, [apiKey])

  useEffect(() => {
    setStoredValue(DEFAULT_MODEL_KEY, defaultModel)
  }, [defaultModel])

  return {
    userId,
    apiKey,
    defaultModel,
    hasApiKey: apiKey !== null && apiKey !== "",
    setApiKey: handleSetApiKey,
    setDefaultModel: handleSetDefaultModel,
    clearApiKey: handleClearApiKey,
    clearUserData: handleClearUserData,
  }
}