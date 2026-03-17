import { AUDIENCE_SEGMENTS } from "../../types"

const SEGMENT_ICONS: Record<string, string> = {
  "performance marketer": "📊",
  "brand strategist": "🎯",
  "skeptical founder": "🤔",
  "agency lead": "👔",
  "data scientist": "📈",
  "cynical operator": "😏",
  "enthusiastic early adopter": "🚀",
  "competitor-adjacent voice": "🔍",
  "creator/influencer type": "✨",
  "casual observer": "👁️",
}

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
      <span className="segment-card-icon" aria-hidden="true">
        {SEGMENT_ICONS[segment] || "👤"}
      </span>
      <span className="segment-card-label">{segment}</span>
      {isSelected && (
        <span className="segment-card-check" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      )}
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
    </div>
  )
}
