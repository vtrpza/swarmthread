import { useEffect, useState } from "react"

interface UseFormDraftOptions<T> {
  key: string
  defaultValue: T
  debounceMs?: number
}

export function useFormDraft<T>({ key, defaultValue, debounceMs = 1000 }: UseFormDraftOptions<T>) {
  const [draft, setDraft] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue
    try {
      const saved = localStorage.getItem(key)
      return saved ? (JSON.parse(saved) as T) : defaultValue
    } catch {
      return defaultValue
    }
  })

  const [hasDraft, setHasDraft] = useState(() => {
    if (typeof window === "undefined") return false
    return localStorage.getItem(key) !== null
  })

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(draft))
        setHasDraft(true)
      } catch {
        // Ignore storage errors (e.g., quota exceeded)
      }
    }, debounceMs)

    return () => clearTimeout(timeoutId)
  }, [draft, key, debounceMs])

  const clearDraft = () => {
    try {
      localStorage.removeItem(key)
      setHasDraft(false)
      setDraft(defaultValue)
    } catch {
      // Ignore
    }
  }

  const updateDraft = (updater: (prev: T) => T) => {
    setDraft((prev) => updater(prev))
  }

  return {
    draft,
    setDraft,
    updateDraft,
    clearDraft,
    hasDraft,
  }
}
