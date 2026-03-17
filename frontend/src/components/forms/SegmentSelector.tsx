import { AUDIENCE_SEGMENTS } from "../../types"

const SEGMENT_DESCRIPTIONS: Record<string, string> = {
  "performance marketer": "Focuses on ROI, metrics, and conversion rates",
  "brand strategist": "Cares about positioning, messaging, and brand consistency",
  "skeptical founder": "Questions everything, wants proof and validation",
  "agency lead": "Understands the industry, evaluates partnerships",
  "data scientist": "Looks for statistical significance and methodology",
  "cynical operator": "Seen it all, filters out hype and fluff",
  "enthusiastic early adopter": "Loves trying new things, quick to engage",
  "competitor-adjacent voice": "Knows the competitive landscape intimately",
  "creator/influencer type": "Values authenticity and shareability",
  "casual observer": "General consumer perspective, easily influenced",
}

interface SegmentCardProps {
  segment: string
  isSelected: boolean
  onToggle: (segment: string) => void
}

export function SegmentCard({ segment, isSelected, onToggle }: SegmentCardProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(segment)}
      className={`segment-card ${isSelected ? "segment-card-selected" : ""}`}
      aria-pressed={isSelected}
      title={SEGMENT_DESCRIPTIONS[segment]}
    >
      <span className="segment-card-label">{segment}</span>
      {isSelected && (
        <span className="segment-card-check" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      )}

      <style>{`
        .segment-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-3);
          padding: var(--space-4);
          background: var(--bg-subtle);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
          position: relative;
          min-height: auto;
        }

        .segment-card:hover {
          border-color: var(--border-default);
          background: var(--bg-surface);
        }

        .segment-card-selected {
          border-color: var(--primary);
          background: var(--primary-subtle);
        }

        .segment-card-selected:hover {
          border-color: var(--primary);
          background: var(--primary-subtle);
        }

        .segment-card-label {
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1.4;
        }

        .segment-card-selected .segment-card-label {
          color: var(--primary);
        }

        .segment-card-check {
          width: 20px;
          height: 20px;
          background: var(--primary);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .segment-card-check svg {
          width: 12px;
          height: 12px;
        }
      `}</style>
    </button>
  )
}

interface SegmentSelectorProps {
  selectedSegments: string[]
  onToggle: (segment: string) => void
  onSelectAll: () => void
  onClearAll: () => void
}

export function SegmentSelector({
  selectedSegments,
  onToggle,
  onSelectAll,
  onClearAll,
}: SegmentSelectorProps) {
  return (
    <div className="segment-selector">
      <div className="segment-selector-header">
        <span className="segment-selector-count">
          {selectedSegments.length} of {AUDIENCE_SEGMENTS.length} selected
        </span>
        <div className="segment-selector-actions">
          <button
            type="button"
            onClick={onSelectAll}
            className="segment-selector-action"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={onClearAll}
            className="segment-selector-action"
            disabled={selectedSegments.length === 0}
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="segment-grid" role="group" aria-label="Audience segments">
        {AUDIENCE_SEGMENTS.map((segment) => (
          <SegmentCard
            key={segment}
            segment={segment}
            isSelected={selectedSegments.includes(segment)}
            onToggle={onToggle}
          />
        ))}
      </div>

      <style>{`
        .segment-selector {
          margin-top: var(--space-4);
        }

        .segment-selector-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-4);
        }

        .segment-selector-count {
          font-size: var(--text-sm);
          color: var(--text-tertiary);
          font-weight: 500;
          font-family: var(--font-mono);
        }

        .segment-selector-actions {
          display: flex;
          gap: var(--space-3);
        }

        .segment-selector-action {
          background: none;
          border: none;
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--primary);
          cursor: pointer;
          padding: var(--space-1) var(--space-2);
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
          min-height: auto;
        }

        .segment-selector-action:hover:not(:disabled) {
          background: var(--primary-subtle);
        }

        .segment-selector-action:disabled {
          color: var(--text-muted);
          cursor: not-allowed;
        }

        .segment-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: var(--space-3);
        }

        @media (max-width: 640px) {
          .segment-grid {
            grid-template-columns: 1fr;
          }

          .segment-selector-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--space-2);
          }
        }
      `}</style>
    </div>
  )
}
