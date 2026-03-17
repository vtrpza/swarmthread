interface CharacterCounterProps {
  current: number
  max?: number
  min?: number
}

export function CharacterCounter({ current, max, min }: CharacterCounterProps) {
  const getStatus = () => {
    if (max && current > max) return "error"
    if (max && current > max * 0.9) return "warning"
    if (min && current < min) return "error"
    return "normal"
  }

  const status = getStatus()
  const displayText = max ? `${current}/${max}` : `${current}`

  return (
    <span
      className={`character-counter character-counter-${status}`}
      aria-label={`${current} characters${max ? ` of ${max} maximum` : ""}`}
    >
      {displayText}

      <style>{`
        .character-counter {
          display: block;
          text-align: right;
          font-size: var(--text-xs);
          color: var(--text-muted);
          margin-top: var(--space-2);
          font-family: var(--font-mono);
          letter-spacing: var(--tracking-wide);
          font-weight: 500;
          transition: color var(--transition-fast);
        }

        .character-counter-warning {
          color: var(--warning);
          font-weight: 600;
        }

        .character-counter-error {
          color: var(--error);
          font-weight: 600;
        }
      `}</style>
    </span>
  )
}
