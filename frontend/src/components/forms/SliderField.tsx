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

      <style>{`
        .slider-field {
          margin-bottom: var(--space-6);
        }

        .slider-field-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-3);
        }

        .slider-field-value {
          font-family: var(--font-mono);
          font-size: var(--text-lg);
          font-weight: 600;
          color: var(--primary);
        }

        .slider-container {
          position: relative;
          margin-bottom: var(--space-3);
        }

        .slider-input {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 4px;
          background: transparent;
          cursor: pointer;
          position: relative;
          z-index: 2;
          padding: 0;
          min-height: auto;
        }

        .slider-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          background: var(--bg-elevated);
          border: 2px solid var(--primary);
          border-radius: 50%;
          cursor: pointer;
          transition: all var(--transition-fast);
          box-shadow: var(--shadow-sm);
          margin-top: -8px;
        }

        .slider-input::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: var(--shadow-glow-sm);
        }

        .slider-input::-moz-range-thumb {
          width: 20px;
          height: 20px;
          background: var(--bg-elevated);
          border: 2px solid var(--primary);
          border-radius: 50%;
          cursor: pointer;
          transition: all var(--transition-fast);
          box-shadow: var(--shadow-sm);
        }

        .slider-input::-webkit-slider-runnable-track {
          width: 100%;
          height: 4px;
          background: var(--border-subtle);
          border-radius: var(--radius-full);
        }

        .slider-input::-moz-range-track {
          width: 100%;
          height: 4px;
          background: var(--border-subtle);
          border-radius: var(--radius-full);
        }

        .slider-track {
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 4px;
          background: var(--border-subtle);
          border-radius: var(--radius-full);
          transform: translateY(-50%);
          z-index: 1;
          pointer-events: none;
        }

        .slider-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: var(--primary);
          border-radius: var(--radius-full);
          transition: width 0.1s ease;
        }

        .slider-presets {
          display: flex;
          gap: var(--space-2);
          flex-wrap: wrap;
        }

        .slider-preset {
          padding: var(--space-1) var(--space-3);
          background: var(--bg-subtle);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          cursor: pointer;
          transition: all var(--transition-fast);
          min-height: auto;
          font-weight: 500;
        }

        .slider-preset:hover {
          border-color: var(--border-default);
          color: var(--text-secondary);
        }

        .slider-preset-active {
          background: var(--primary-subtle);
          border-color: var(--primary);
          color: var(--primary);
        }
      `}</style>
    </div>
  )
}
