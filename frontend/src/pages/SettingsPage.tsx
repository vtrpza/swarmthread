import { useState } from "react"
import { useNavigate } from "react-router"
import { useUserSettings } from "../hooks/useUserSettings"
import { validateApiKey, listModels } from "../api/models"
import { createUser } from "../api/users"
import "./SettingsPage.css"

export default function SettingsPage() {
  const navigate = useNavigate()
  const {
    userId,
    apiKey,
    defaultModel,
    hasApiKey,
    setApiKey,
    setDefaultModel,
    clearApiKey,
    clearUserData,
  } = useUserSettings()

  const [inputKey, setInputKey] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    valid: boolean
    message: string
  } | null>(null)
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [availableModels, setAvailableModels] = useState<
    Array<{ id: string; name: string }>
  >([])
  const [isSaving, setIsSaving] = useState(false)
  const [showApiKey, setShowApiKey] = useState(false)

  const handleValidateKey = async () => {
    if (!inputKey.trim()) return

    setIsValidating(true)
    setValidationResult(null)

    const previousKey = apiKey
    try {
      setApiKey(inputKey.trim())

      const result = await validateApiKey()

      if (result.valid) {
        setValidationResult({ valid: true, message: "API key is valid!" })
      } else {
        setValidationResult({
          valid: false,
          message: result.error || "Invalid API key",
        })
        if (!previousKey) {
          clearApiKey()
        } else {
          setApiKey(previousKey)
        }
      }
    } catch (error) {
      setValidationResult({
        valid: false,
        message: error instanceof Error ? error.message : "Validation failed",
      })
      if (previousKey) {
        setApiKey(previousKey)
      } else {
        clearApiKey()
      }
    } finally {
      setIsValidating(false)
    }
  }

  const handleLoadModels = async () => {
    if (!hasApiKey) return

    setIsLoadingModels(true)
    try {
      const models = await listModels()
      setAvailableModels(models.map((m) => ({ id: m.id, name: m.name })))
    } catch (error) {
      console.error("Failed to load models:", error)
    } finally {
      setIsLoadingModels(false)
    }
  }

  const handleSaveAndContinue = async () => {
    if (!hasApiKey) return

    setIsSaving(true)
    try {
      await createUser(userId)
      navigate("/")
    } catch (error) {
      console.error("Failed to save user:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleClearData = () => {
    if (window.confirm("This will clear all your data including your API key. Continue?")) {
      clearUserData()
      setInputKey("")
      setValidationResult(null)
      setAvailableModels([])
    }
  }

  return (
    <main className="settings-page">
      <div className="settings-container">
        <header className="settings-header">
          <h1 className="settings-title">Settings</h1>
          <p className="settings-subtitle">
            Configure your OpenRouter API key to run simulations.
          </p>
        </header>

        <section className="settings-section">
          <h2 className="section-title">Your User ID</h2>
          <p className="section-description">
            This ID identifies your runs and history. Save it if you want to access your
            data from another browser.
          </p>
          <div className="user-id-display">
            <code className="user-id-code">{userId}</code>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => navigator.clipboard.writeText(userId)}
            >
              Copy
            </button>
          </div>
        </section>

        <section className="settings-section">
          <h2 className="section-title">OpenRouter API Key</h2>
          <p className="section-description">
            Your API key is stored locally in your browser and never sent to our servers
            except to make LLM calls during simulations.
          </p>

          {hasApiKey ? (
            <div className="api-key-status">
              <div className="status-indicator status-success">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>API key configured</span>
              </div>
              <div className="api-key-display">
                <code className="api-key-code">
                  {showApiKey ? apiKey : "•".repeat(20)}
                </code>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowApiKey((current) => !current)}
                >
                  {showApiKey ? "Hide" : "Show"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={clearApiKey}
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div className="api-key-input-group">
              <input
                type="password"
                value={inputKey}
                onChange={(event) => setInputKey(event.target.value)}
                className="input"
                placeholder="sk-or-v1-..."
              />
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleValidateKey}
                disabled={isValidating || !inputKey.trim()}
              >
                {isValidating ? "Validating..." : "Save & Validate"}
              </button>
            </div>
          )}

          {validationResult && (
            <div
              className={`validation-result ${
                validationResult.valid ? "validation-success" : "validation-error"
              }`}
            >
              {validationResult.message}
            </div>
          )}
        </section>

        {hasApiKey && (
          <section className="settings-section">
            <h2 className="section-title">Default Model</h2>
            <p className="section-description">
              Select your preferred model for simulations. You can override this per run.
            </p>

            <div className="model-selector">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleLoadModels}
                disabled={isLoadingModels}
              >
                {isLoadingModels ? "Loading..." : "Load Available Models"}
              </button>

              {availableModels.length > 0 && (
                <div className="select-wrapper">
                  <select
                    value={defaultModel}
                    onChange={(event) => setDefaultModel(event.target.value)}
                    className="input select"
                  >
                    {availableModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="current-model">
                <span className="current-model-label">Current:</span>
                <code className="current-model-value">{defaultModel}</code>
              </div>
            </div>
          </section>
        )}

        <div className="settings-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSaveAndContinue}
            disabled={!hasApiKey || isSaving}
          >
            {isSaving ? "Saving..." : "Save and Continue"}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate("/history")}
            disabled={!hasApiKey}
          >
            View History
          </button>

          <button type="button" className="btn btn-danger" onClick={handleClearData}>
            Clear All Data
          </button>
        </div>
      </div>
    </main>
  )
}