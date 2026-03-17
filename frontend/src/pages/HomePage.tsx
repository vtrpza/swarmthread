import { useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { useCreateRun } from "../hooks/useCreateRun"
import { useFormDraft } from "../hooks/useFormDraft"
import {
  CharacterCounter,
  FormStepper,
  SegmentSelector,
  SliderField,
} from "../components/forms"
import {
  AUDIENCE_SEGMENTS,
  CONTENT_TYPES,
  SIMULATION_PRESETS,
} from "../types"
import type { RunCreate, SimulationPreset } from "../types"
import "./HomePage.css"

const FORM_STEPS = [
  { id: "brief", label: "Brief" },
  { id: "audience", label: "Audience" },
]

const AVG_DECISION_COST = 0.00036

const DEFAULT_FORM: RunCreate = {
  title: "",
  brand: "",
  goal: "",
  message: "",
  audience_segments: [],
  simulation_preset: "standard",
  max_total_cost_usd: 10.0,
}

export default function HomePage() {
  const navigate = useNavigate()
  const createRun = useCreateRun()
  const [currentStep, setCurrentStep] = useState(0)
  const [showSettings, setShowSettings] = useState(false)

  const {
    draft: form,
    updateDraft,
    clearDraft,
    hasDraft,
  } = useFormDraft<RunCreate>({
    key: "swarmthread:run-draft",
    defaultValue: DEFAULT_FORM,
  })

  const preset = SIMULATION_PRESETS[form.simulation_preset ?? "standard"]

  const completedSteps = useMemo(() => {
    const completed = new Set<number>()

    if (form.brand?.trim() && form.goal?.trim() && form.message?.trim()) {
      completed.add(0)
    }

    completed.add(1)
    return completed
  }, [form.brand, form.goal, form.message])

  const estimatedCost = useMemo(() => {
    return (preset.agentCount * preset.roundCount * AVG_DECISION_COST) + 0.01
  }, [preset.agentCount, preset.roundCount])

  const isFormValid = useMemo(() => {
    return Boolean(form.brand?.trim() && form.goal?.trim() && form.message?.trim())
  }, [form.brand, form.goal, form.message])

  const handleSegmentToggle = (segment: string) => {
    updateDraft((prev) => ({
      ...prev,
      audience_segments: prev.audience_segments?.includes(segment)
        ? prev.audience_segments.filter((value) => value !== segment)
        : [...(prev.audience_segments ?? []), segment],
    }))
  }

  const handleSelectAllSegments = () => {
    updateDraft((prev) => ({
      ...prev,
      audience_segments: [...AUDIENCE_SEGMENTS],
    }))
  }

  const handleClearAllSegments = () => {
    updateDraft((prev) => ({
      ...prev,
      audience_segments: [],
    }))
  }

  const handleSubmit = async () => {
    if (!isFormValid) return

    const payload: RunCreate = {
      ...form,
      title: form.title?.trim() || undefined,
      cta: form.cta?.trim() || undefined,
      tone: form.tone?.trim() || undefined,
      content_type: form.content_type || undefined,
      audience_segments:
        form.audience_segments && form.audience_segments.length > 0
          ? form.audience_segments
          : undefined,
      simulation_preset: form.simulation_preset ?? "standard",
    }

    try {
      const result = await createRun.mutateAsync(payload)
      clearDraft()
      navigate(`/runs/${result.id}`)
    } catch {
      // Mutation state is rendered below.
    }
  }

  const renderStepContent = (step: number) => {
    if (step === 0) {
      return (
        <div className="form-section-content">
          <div className="form-group">
            <div className="label-wrapper">
              <label className="label" htmlFor="title">
                Run Title
              </label>
              <span className="label-hint">Optional</span>
            </div>
            <div className="input-wrapper">
              <input
                id="title"
                type="text"
                value={form.title ?? ""}
                onChange={(event) =>
                  updateDraft((prev) => ({ ...prev, title: event.target.value }))
                }
                className="input"
                placeholder="Defaults to Brand + Goal"
                maxLength={100}
              />
              <CharacterCounter current={(form.title ?? "").length} max={100} />
            </div>
          </div>

          <div className="form-row form-row-divided">
            <div className="form-group">
              <label className="label label-required" htmlFor="brand">
                Brand
              </label>
              <input
                id="brand"
                type="text"
                required
                value={form.brand}
                onChange={(event) =>
                  updateDraft((prev) => ({ ...prev, brand: event.target.value }))
                }
                className="input"
                placeholder="Your company or product"
                maxLength={60}
              />
            </div>

            <div className="form-group">
              <label className="label label-required" htmlFor="goal">
                Goal
              </label>
              <input
                id="goal"
                type="text"
                required
                value={form.goal}
                onChange={(event) =>
                  updateDraft((prev) => ({ ...prev, goal: event.target.value }))
                }
                className="input"
                placeholder="What outcome should this message drive?"
                maxLength={120}
              />
            </div>
          </div>

          <div className="form-group form-group-last">
            <label className="label label-required" htmlFor="message">
              Message Draft
            </label>
            <textarea
              id="message"
              required
              rows={7}
              value={form.message}
              onChange={(event) =>
                updateDraft((prev) => ({ ...prev, message: event.target.value }))
              }
              className="input textarea"
              placeholder="Paste the message you want to simulate before publishing."
              maxLength={2000}
            />
            <CharacterCounter current={form.message.length} max={2000} />
            <p className="field-help-text">
              SwarmThread will treat this as a directional audience-reaction test, not a guaranteed forecast.
            </p>
          </div>
        </div>
      )
    }

    return (
      <div className="form-section-content">
        <div className="form-group">
          <label className="label" htmlFor="audience-segments">
            Priority Audience Segments
          </label>
          <p className="form-help-text">
            Optional. Choose the audiences you care about most. If you leave this blank, SwarmThread uses a balanced default mix.
          </p>
          <SegmentSelector
            selectedSegments={form.audience_segments ?? []}
            onToggle={handleSegmentToggle}
            onSelectAll={handleSelectAllSegments}
            onClearAll={handleClearAllSegments}
          />
        </div>
      </div>
    )
  }

  const handlePresetChange = (presetValue: SimulationPreset) => {
    updateDraft((prev) => ({
      ...prev,
      simulation_preset: presetValue,
    }))
  }

  return (
    <main className="home-page">
      <div className="home-page-container">
        <header className="home-page-header animate-reveal">
          <h1 className="home-page-title">Create Audience Simulation</h1>
          <p className="home-page-subtitle">
            Pressure-test one message against a simulated audience before you publish it.
          </p>
          {hasDraft && (
            <div className="draft-indicator">
              <span className="draft-indicator-text">Draft saved</span>
              <button
                type="button"
                onClick={clearDraft}
                className="draft-clear-btn"
              >
                Clear
              </button>
            </div>
          )}
        </header>

        <FormStepper
          steps={FORM_STEPS}
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={setCurrentStep}
        />

        <form onSubmit={(e) => e.preventDefault()} className="home-page-form animate-scale">
          <div className="form-section-wrapper">
            <div className="form-section-header">
              <h2 className="form-section-title">{FORM_STEPS[currentStep].label}</h2>
              {completedSteps.has(currentStep) && (
                <span className="section-complete-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Ready
                </span>
              )}
            </div>
            {renderStepContent(currentStep)}
          </div>

          <div className="settings-panel">
            <button
              type="button"
              className="settings-panel-toggle"
              onClick={() => setShowSettings((current) => !current)}
              aria-expanded={showSettings}
            >
              <div className="settings-panel-toggle-left">
                <span className="settings-panel-title">Advanced</span>
                <span className="settings-panel-summary">
                  {preset.label} preset, {preset.agentCount} agents, {preset.roundCount} rounds, ${(
                    form.max_total_cost_usd ?? 10
                  ).toFixed(0)} budget
                </span>
              </div>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`settings-panel-chevron ${showSettings ? "settings-panel-chevron-open" : ""}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showSettings && (
              <div className="settings-panel-content">
                <div className="preset-grid">
                  {(Object.entries(SIMULATION_PRESETS) as Array<
                    [SimulationPreset, (typeof SIMULATION_PRESETS)[SimulationPreset]]
                  >).map(([presetValue, config]) => (
                    <button
                      key={presetValue}
                      type="button"
                      className={`preset-card ${
                        (form.simulation_preset ?? "standard") === presetValue
                          ? "preset-card-active"
                          : ""
                      }`}
                      onClick={() => handlePresetChange(presetValue)}
                    >
                      <span className="preset-card-label">{config.label}</span>
                      <span className="preset-card-meta">
                        {config.agentCount} agents · {config.roundCount} rounds
                      </span>
                    </button>
                  ))}
                </div>

                <div className="form-row form-row-divided">
                  <div className="form-group">
                    <label className="label" htmlFor="content_type">
                      Content Type
                    </label>
                    <div className="select-wrapper">
                      <select
                        id="content_type"
                        value={form.content_type ?? ""}
                        onChange={(event) =>
                          updateDraft((prev) => ({
                            ...prev,
                            content_type: event.target.value || undefined,
                          }))
                        }
                        className="input select"
                      >
                        <option value="">Infer from message</option>
                        {CONTENT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type
                              .split("_")
                              .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                              .join(" ")}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="label" htmlFor="tone">
                      Tone Hint
                    </label>
                    <input
                      id="tone"
                      type="text"
                      value={form.tone ?? ""}
                      onChange={(event) =>
                        updateDraft((prev) => ({ ...prev, tone: event.target.value }))
                      }
                      className="input"
                      placeholder="Optional tone guidance"
                      maxLength={100}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="label" htmlFor="cta">
                    CTA Hint
                  </label>
                  <input
                    id="cta"
                    type="text"
                    value={form.cta ?? ""}
                    onChange={(event) =>
                      updateDraft((prev) => ({ ...prev, cta: event.target.value }))
                    }
                    className="input"
                    placeholder="Optional CTA or desired next step"
                    maxLength={120}
                  />
                </div>

                <SliderField
                  id="max_cost"
                  label="Max Budget"
                  value={form.max_total_cost_usd ?? 10}
                  min={1}
                  max={50}
                  step={0.5}
                  onChange={(value) =>
                    updateDraft((prev) => ({
                      ...prev,
                      max_total_cost_usd: value,
                    }))
                  }
                  formatValue={(value) => `$${value.toFixed(2)}`}
                  presets={[
                    { label: "$5", value: 5 },
                    { label: "$10", value: 10 },
                    { label: "$25", value: 25 },
                  ]}
                />

                <div className="cost-preview">
                  <div className="cost-preview-header">
                    <span className="cost-preview-label">Estimated LLM Cost</span>
                    <span className="cost-preview-value">~${estimatedCost.toFixed(2)}</span>
                  </div>
                  <div className="cost-preview-breakdown">
                    Based on the {preset.label.toLowerCase()} preset and average call size for the current default model.
                  </div>
                  {estimatedCost > (form.max_total_cost_usd ?? 10) && (
                    <div className="cost-preview-warning">
                      Estimated cost is above your budget cap. Increase the cap or choose a lighter preset.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="form-navigation">
            <button
              type="button"
              onClick={() => setCurrentStep((step) => Math.max(0, step - 1))}
              disabled={currentStep === 0}
              className="btn btn-secondary"
            >
              Previous
            </button>

            <div className="form-navigation-right">
              {currentStep < FORM_STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((step) => Math.min(step + 1, FORM_STEPS.length - 1))}
                  className="btn btn-primary"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={createRun.isPending || !isFormValid}
                  className="btn btn-primary btn-launch"
                >
                  {createRun.isPending ? "Creating..." : "Launch Simulation"}
                </button>
              )}
            </div>
          </div>

          {createRun.isError && (
            <div className="error-state" role="alert">
              <div className="error-state-title">Failed to create run</div>
              <div>
                {createRun.error instanceof Error
                  ? createRun.error.message
                  : "Unknown error"}
              </div>
            </div>
          )}
        </form>
      </div>

      <style>{`
        .preset-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: var(--space-3);
          margin-bottom: var(--space-6);
        }

        .preset-card {
          padding: var(--space-4);
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-default);
          background: var(--bg-surface);
          text-align: left;
          transition: all var(--transition-fast);
        }

        .preset-card:hover {
          border-color: var(--border-hover);
        }

        .preset-card-active {
          border-color: var(--primary);
          background: var(--primary-subtle);
        }

        .preset-card-label {
          display: block;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: var(--space-1);
        }

        .preset-card-meta {
          font-size: var(--text-sm);
          color: var(--text-secondary);
        }

        @media (max-width: 768px) {
          .preset-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  )
}
