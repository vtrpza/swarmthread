interface FormStepperProps {
  steps: { id: string; label: string }[]
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
          const isPast = index < currentStep

          return (
            <li
              key={step.id}
              className={`form-step ${isActive ? "form-step-active" : ""} ${isCompleted ? "form-step-completed" : ""} ${isPast ? "form-step-past" : ""}`}
            >
              {index > 0 && (
                <div
                  className={`form-step-line ${isPast || isActive ? "form-step-line-filled" : ""}`}
                />
              )}
              <button
                type="button"
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className="form-step-button"
                aria-current={isActive ? "step" : undefined}
                aria-label={`Step ${index + 1}: ${step.label}${isCompleted ? " (completed)" : ""}`}
              >
                <span className="form-step-number">
                  {isCompleted && !isActive ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </span>
                <span className="form-step-label">{step.label}</span>
              </button>
            </li>
          )
        })}
      </ol>

      <style>{`
        .form-stepper {
          margin-bottom: var(--space-8);
        }

        .form-stepper-list {
          display: flex;
          list-style: none;
          margin: 0;
          padding: 0;
          align-items: center;
          justify-content: center;
          gap: 0;
        }

        .form-step {
          display: flex;
          align-items: center;
        }

        .form-step-line {
          width: 48px;
          height: 2px;
          background: var(--border-subtle);
          transition: background var(--transition-base);
          flex-shrink: 0;
        }

        .form-step-line-filled {
          background: var(--primary);
        }

        .form-step-button {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          background: none;
          border: none;
          cursor: pointer;
          border-radius: var(--radius-full);
          transition: all var(--transition-base);
          min-height: auto;
          white-space: nowrap;
        }

        .form-step-button:not(:disabled):hover {
          background: var(--bg-subtle);
        }

        .form-step-button:disabled {
          cursor: not-allowed;
        }

        .form-step-number {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--text-xs);
          font-weight: 600;
          background: var(--bg-subtle);
          color: var(--text-muted);
          border: 1.5px solid var(--border-subtle);
          transition: all var(--transition-base);
          font-family: var(--font-mono);
          flex-shrink: 0;
        }

        .form-step-number svg {
          width: 14px;
          height: 14px;
        }

        .form-step-active .form-step-number {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-glow);
        }

        .form-step-completed .form-step-number,
        .form-step-past .form-step-number {
          background: transparent;
          color: var(--primary);
          border-color: var(--primary);
        }

        .form-step-label {
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--text-muted);
          transition: color var(--transition-fast);
        }

        .form-step-active .form-step-label {
          color: var(--text-primary);
          font-weight: 600;
        }

        .form-step-completed .form-step-label,
        .form-step-past .form-step-label {
          color: var(--text-secondary);
        }

        .form-step-button:disabled .form-step-label {
          color: var(--text-muted);
        }

        @media (max-width: 640px) {
          .form-step-line {
            width: 24px;
          }

          .form-step-label {
            display: none;
          }

          .form-step-button {
            padding: var(--space-2);
          }
        }
      `}</style>
    </nav>
  )
}
