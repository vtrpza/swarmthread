interface FormStepperProps {
  steps: { id: string; label: string; icon: string }[]
  currentStep: number
  completedSteps: Set<number>
  onStepClick: (step: number) => void
}

export function FormStepper({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
}: FormStepperProps) {
  return (
    <nav className="form-stepper" aria-label="Form progress">
      <ol className="form-stepper-list">
        {steps.map((step, index) => {
          const isActive = index === currentStep
          const isCompleted = completedSteps.has(index)
          const isClickable = isCompleted || index <= currentStep

          return (
            <li
              key={step.id}
              className={`form-step ${isActive ? "form-step-active" : ""} ${isCompleted ? "form-step-completed" : ""}`}
            >
              <button
                type="button"
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className="form-step-button"
                aria-current={isActive ? "step" : undefined}
                aria-label={`Step ${index + 1}: ${step.label}${isCompleted ? " (completed)" : ""}`}
              >
                <span className="form-step-icon">
                  {isCompleted ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span>{step.icon}</span>
                  )}
                </span>
                <span className="form-step-label">{step.label}</span>
              </button>
              {index < steps.length - 1 && (
                <div
                  className={`form-step-connector ${isCompleted ? "form-step-connector-completed" : ""}`}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
