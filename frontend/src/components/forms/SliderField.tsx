interface SliderFieldProps {
  id: string
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  formatValue?: (value: number) => string
  presets?: { label: string; value: number }[]
}

export function SliderField({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  formatValue = (v) => String(v),
  presets,
}: SliderFieldProps) {
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className="slider-field">
      <div className="slider-field-header">
        <label className="label" htmlFor={id}>
          {label}
        </label>
        <span className="slider-field-value">{formatValue(value)}</span>
      </div>

      <div className="slider-container">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="slider-input"
          style={{ "--slider-percent": `${percentage}%` } as React.CSSProperties}
        />
        <div className="slider-track">
          <div
            className="slider-fill"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {presets && (
        <div className="slider-presets">
          {presets.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => onChange(preset.value)}
              className={`slider-preset ${value === preset.value ? "slider-preset-active" : ""}`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
