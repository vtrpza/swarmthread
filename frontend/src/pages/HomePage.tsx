import { useState, useMemo } from "react"
import { useNavigate } from "react-router"
import { useCreateRun } from "../hooks/useCreateRun"
import { useFormDraft } from "../hooks/useFormDraft"
import {
  CharacterCounter,
  SliderField,
  FormStepper,
  SegmentSelector,
} from "../components/forms"
import { AUDIENCE_SEGMENTS, CONTENT_TYPES, CONTROVERSY_LEVELS } from "../types"
import type { RunCreate } from "../types"
import "./HomePage.css"

const FORM_STEPS = [
  { id: "basic", label: "Basic Info", icon: "1" },
  { id: "content", label: "Content", icon: "2" },
  { id: "audience", label: "Audience", icon: "3" },
  { id: "settings", label: "Settings", icon: "4" },
]

const DEFAULT_FORM: RunCreate = {
  title: "",
  brand: "",
  goal: "",
  content_type: "thought_leadership",
  message: "",
  cta: "",
  tone: "",
  audience_segments: [],
  controversy_level: "low",
  agent_count: 20,
  round_count: 150,
  max_total_cost_usd: 10.0,
}

const COST_PER_AGENT = 0.02

export default function HomePage() {
  const navigate = useNavigate()
  const createRun = useCreateRun()
  const [currentStep, setCurrentStep] = useState(0)
  const [showClearDraftConfirm, setShowClearDraftConfirm] = useState(false)

  const {
    draft: form,
    updateDraft,
    clearDraft,
    hasDraft,
  } = useFormDraft<RunCreate>({
    key: "swarmthread:run-draft",
    defaultValue: DEFAULT_FORM,
  })

  const completedSteps = useMemo(() => {
    const completed = new Set<number>()

    // Step 0: Basic Info - requires title, brand, goal
    if (form.title.trim() && form.brand.trim() && form.goal.trim()) {
      completed.add(0)
    }

    // Step 1: Content - requires message, cta, tone
    if (form.message.trim() && form.cta.trim() && form.tone.trim()) {
      completed.add(1)
    }

    // Step 2: Audience - requires at least one segment
    if (form.audience_segments.length > 0) {
      completed.add(2)
    }

    // Step 3: Settings - always completable
    completed.add(3)

    return completed
  }, [form])

  const estimatedCost = useMemo(() => {
    return (form.agent_count ?? 20) * COST_PER_AGENT
  }, [form.agent_count])

  const isFormValid = useMemo(() => {
    return (
      form.title.trim() &&
      form.brand.trim() &&
      form.goal.trim() &&
      form.message.trim() &&
      form.cta.trim() &&
      form.tone.trim() &&
      form.audience_segments.length > 0
    )
  }, [form])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return

    try {
      const result = await createRun.mutateAsync(form)
      clearDraft()
      navigate(`/runs/${result.id}`)
    } catch {
      // Error is handled by the mutation
    }
  }

  const handleSegmentToggle = (segment: string) => {
    updateDraft((prev) => ({
      ...prev,
      audience_segments: prev.audience_segments.includes(segment)
        ? prev.audience_segments.filter((s) => s !== segment)
        : [...prev.audience_segments, segment],
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

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <div className="form-section-content">
            <div className="form-group">
              <label className="label label-required" htmlFor="title">
                Campaign Title
              </label>
              <input
                id="title"
                type="text"
                required
                value={form.title}
                onChange={(e) =>
                  updateDraft((prev) => ({ ...prev, title: e.target.value }))
                }
                className="input"
                placeholder="Enter a descriptive name for this campaign"
                maxLength={100}
              />
              <CharacterCounter current={form.title.length} max={100} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label label-required" htmlFor="brand">
                  Brand Name
                </label>
                <input
                  id="brand"
                  type="text"
                  required
                  value={form.brand}
                  onChange={(e) =>
                    updateDraft((prev) => ({ ...prev, brand: e.target.value }))
                  }
                  className="input"
                  placeholder="Your company or product name"
                  maxLength={50}
                />
              </div>
              <div className="form-group">
                <label className="label label-required" htmlFor="goal">
                  Campaign Goal
                </label>
                <input
                  id="goal"
                  type="text"
                  required
                  value={form.goal}
                  onChange={(e) =>
                    updateDraft((prev) => ({ ...prev, goal: e.target.value }))
                  }
                  className="input"
                  placeholder="e.g., Drive newsletter signups"
                  maxLength={100}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label label-required" htmlFor="content_type">
                Content Type
              </label>
              <select
                id="content_type"
                value={form.content_type}
                onChange={(e) =>
                  updateDraft((prev) => ({
                    ...prev,
                    content_type: e.target.value,
                  }))
                }
                className="input select"
              >
                {CONTENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type
                      .split("_")
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(" ")}
                  </option>
                ))}
              </select>
              <p className="field-help-text">
                Choose the category that best describes your content
              </p>
            </div>
          </div>
        )

      case 1:
        return (
          <div className="form-section-content">
            <div className="form-group">
              <label className="label label-required" htmlFor="message">
                Main Message
              </label>
              <textarea
                id="message"
                required
                rows={6}
                value={form.message}
                onChange={(e) =>
                  updateDraft((prev) => ({ ...prev, message: e.target.value }))
                }
                className="input textarea"
                placeholder="Write the content you want to test with your audience..."
                maxLength={2000}
              />
              <CharacterCounter current={form.message.length} max={2000} />
              <p className="field-help-text">
                This is the main content that will be shared with simulated
                audience members
              </p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label label-required" htmlFor="cta">
                  Call to Action
                </label>
                <input
                  id="cta"
                  type="text"
                  required
                  value={form.cta}
                  onChange={(e) =>
                    updateDraft((prev) => ({ ...prev, cta: e.target.value }))
                  }
                  className="input"
                  placeholder="e.g., Get started today"
                  maxLength={100}
                />
                <CharacterCounter current={form.cta.length} max={100} />
              </div>
              <div className="form-group">
                <label className="label label-required" htmlFor="tone">
                  Tone of Voice
                </label>
                <input
                  id="tone"
                  type="text"
                  required
                  value={form.tone}
                  onChange={(e) =>
                    updateDraft((prev) => ({ ...prev, tone: e.target.value }))
                  }
                  className="input"
                  placeholder="e.g., Confident, friendly, professional"
                  maxLength={100}
                />
                <CharacterCounter current={form.tone.length} max={100} />
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="form-section-content">
            <div className="form-group">
              <label className="label">Target Audience Segments</label>
              <p className="form-help-text">
                Select the personas you want to simulate in this campaign
              </p>
              <SegmentSelector
                selectedSegments={form.audience_segments}
                onToggle={handleSegmentToggle}
                onSelectAll={handleSelectAllSegments}
                onClearAll={handleClearAllSegments}
              />
            </div>

            <div className="form-group">
              <label className="label" htmlFor="controversy_level">
                Controversy Level
              </label>
              <div className="controversy-toggle">
                {CONTROVERSY_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() =>
                      updateDraft((prev) => ({
                        ...prev,
                        controversy_level: level,
                      }))
                    }
                    className={`controversy-btn ${
                      form.controversy_level === level
                        ? `controversy-btn-${level} controversy-btn-active`
                        : ""
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
              <p className="field-help-text">
                Higher controversy levels create more polarized reactions
              </p>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="form-section-content">
            <div className="settings-grid">
              <SliderField
                id="agent_count"
                label="Number of Agents"
                value={form.agent_count ?? 20}
                min={5}
                max={100}
                onChange={(value) =>
                  updateDraft((prev) => ({ ...prev, agent_count: value }))
                }
                presets={[
                  { label: "Small (10)", value: 10 },
                  { label: "Medium (20)", value: 20 },
                  { label: "Large (50)", value: 50 },
                ]}
              />

              <SliderField
                id="round_count"
                label="Simulation Rounds"
                value={form.round_count ?? 150}
                min={50}
                max={500}
                step={10}
                onChange={(value) =>
                  updateDraft((prev) => ({ ...prev, round_count: value }))
                }
                presets={[
                  { label: "Quick (100)", value: 100 },
                  { label: "Standard (150)", value: 150 },
                  { label: "Thorough (300)", value: 300 },
                ]}
              />

              <SliderField
                id="max_cost"
                label="Max Cost Budget"
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
                formatValue={(v) => `$${v.toFixed(2)}`}
                presets={[
                  { label: "$5", value: 5 },
                  { label: "$10", value: 10 },
                  { label: "$25", value: 25 },
                ]}
              />
            </div>

            <div className="cost-preview">
              <div className="cost-preview-header">
                <span>Estimated Cost</span>
                <span className="cost-preview-value">
                  ~${estimatedCost.toFixed(2)}
                </span>
              </div>
              <div className="cost-preview-breakdown">
                {form.agent_count} agents × ${COST_PER_AGENT.toFixed(2)} per agent
              </div>
              {estimatedCost > (form.max_total_cost_usd ?? 10) && (
                <div className="cost-preview-warning">
                  Estimated cost exceeds your budget limit
                </div>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <main className="home-page">
      <div className="home-page-container">
        <header className="home-page-header">
          <h1 className="home-page-title">Create New Simulation</h1>
          <p className="home-page-subtitle">
            Set up a batch simulation to predict marketing content impact
          </p>
          {hasDraft && (
            <div className="draft-indicator">
              <span>Draft auto-saved</span>
              <button
                type="button"
                onClick={() => setShowClearDraftConfirm(true)}
                className="draft-clear-btn"
              >
                Clear draft
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

        <form onSubmit={handleSubmit} className="home-page-form">
          <div className="form-section-wrapper">
            <div className="form-section-header">
              <h2 className="form-section-title">
                <span className="form-section-icon">{FORM_STEPS[currentStep].icon}</span>
                {FORM_STEPS[currentStep].label}
              </h2>
              <div className="form-section-progress">
                {completedSteps.has(currentStep) && (
                  <span className="section-complete-badge">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Complete
                  </span>
                )}
              </div>
            </div>

            {renderStepContent(currentStep)}
          </div>

          <div className="form-navigation">
            <button
              type="button"
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              disabled={currentStep === 0}
              className="btn btn-secondary"
            >
              Previous
            </button>

            {currentStep < FORM_STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((s) => Math.min(FORM_STEPS.length - 1, s + 1))}
                className="btn btn-primary"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={createRun.isPending || !isFormValid}
                className="btn btn-primary btn-lg"
              >
                {createRun.isPending ? (
                  <>
                    <span className="btn-spinner" />
                    Creating Run...
                  </>
                ) : (
                  "Create Simulation Run"
                )}
              </button>
            )}
          </div>

          {createRun.isError && (
            <div className="error-state" role="alert">
              <div className="error-state-title">Error</div>
              <div>
                {createRun.error instanceof Error
                  ? createRun.error.message
                  : "Failed to create run"}
              </div>
            </div>
          )}
        </form>
      </div>

      {showClearDraftConfirm && (
        <div
          className="modal-overlay"
          onClick={() => setShowClearDraftConfirm(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-draft-title"
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 id="clear-draft-title" className="modal-title">
              Clear Draft?
            </h3>
            <p className="modal-description">
              This will remove all saved form data and reset to defaults.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setShowClearDraftConfirm(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clearDraft()
                  setShowClearDraftConfirm(false)
                }}
                className="btn btn-primary"
              >
                Clear Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
