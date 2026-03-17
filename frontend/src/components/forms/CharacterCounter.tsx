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
    </span>
  )
}
