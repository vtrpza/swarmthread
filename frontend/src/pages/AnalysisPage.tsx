import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import { getAnalysis } from '../api/runs'
import { formatDateTime, formatPercent } from '../utils/formatters'
import type { SegmentReaction } from '../types'
import './AnalysisPage.css'

const REACTION_STYLES: Record<
  SegmentReaction['reaction'],
  { background: string; text: string; border: string }
> = {
  positive: {
    background: 'var(--success-subtle)',
    text: 'var(--success)',
    border: 'var(--success-glow)',
  },
  mixed: {
    background: 'var(--warning-subtle)',
    text: 'var(--warning)',
    border: 'var(--warning-glow)',
  },
  negative: {
    background: 'var(--error-subtle)',
    text: 'var(--error)',
    border: 'var(--error-glow)',
  },
}

const RECOMMENDATION_COPY = {
  ship: 'Strong enough to ship with only minor edits.',
  revise: 'Needs revisions before it is safe to publish.',
  avoid: 'The current version is likely to create more resistance than momentum.',
}

const METRIC_COPY = {
  predicted_engagement: 'How strongly the audience is expected to react.',
  predicted_shareability: 'How likely the message is to travel across the network.',
  predicted_conversion_signal: 'How much intent or action the message is likely to create.',
  predicted_trust: 'How much the message is expected to strengthen credibility.',
}

function MetricCard({
  label,
  description,
  value,
}: {
  label: string
  description: string
  value: number
}) {
  return (
    <article className="analysis-metric-card">
      <div className="analysis-metric-topline">
        <span className="analysis-metric-label">{label}</span>
        <strong className="analysis-metric-value">{formatPercent(value)}</strong>
      </div>
      <div className="analysis-metric-bar-track">
        <div className="analysis-metric-bar" style={{ width: formatPercent(value) }} />
      </div>
      <p className="analysis-metric-description">{description}</p>
    </article>
  )
}

function TagList({
  items,
  variant,
  emptyCopy,
}: {
  items: string[]
  variant: 'positive' | 'negative' | 'warning' | 'neutral'
  emptyCopy: string
}) {
  if (items.length === 0) {
    return <p className="analysis-empty-copy">{emptyCopy}</p>
  }

  return (
    <div className="analysis-tag-list">
      {items.map((item) => (
        <span key={item} className={`analysis-tag analysis-tag-${variant}`}>
          {item}
        </span>
      ))}
    </div>
  )
}

function SegmentCard({ segment }: { segment: SegmentReaction }) {
  const style = REACTION_STYLES[segment.reaction]

  return (
    <article className="analysis-segment-card">
      <div className="analysis-segment-header">
        <div>
          <span className="analysis-segment-eyebrow">Audience segment</span>
          <h3 className="analysis-segment-title">{segment.segment}</h3>
          <p className="analysis-segment-share">
            {formatPercent(segment.simulated_share)} of the simulated audience
          </p>
        </div>
        <span
          className="analysis-segment-reaction"
          style={{
            background: style.background,
            color: style.text,
            borderColor: style.border,
          }}
        >
          {segment.reaction}
        </span>
      </div>

      <p className="analysis-segment-summary">{segment.summary}</p>

      <div className="analysis-segment-block">
        <h4>What resonated</h4>
        <TagList
          items={segment.key_resonators}
          variant="positive"
          emptyCopy="No clear resonators surfaced for this segment."
        />
      </div>

      <div className="analysis-segment-block">
        <h4>Key objections</h4>
        <TagList
          items={segment.key_objections}
          variant="negative"
          emptyCopy="No consistent objections surfaced for this segment."
        />
      </div>

      <div className="analysis-segment-block">
        <h4>Representative simulated posts</h4>
        {segment.representative_posts.length === 0 ? (
          <p className="analysis-empty-copy">No representative posts were captured.</p>
        ) : (
          <div className="analysis-quote-list">
            {segment.representative_posts.map((post) => (
              <blockquote key={post} className="analysis-quote-card">
                {post}
              </blockquote>
            ))}
          </div>
        )}
      </div>
    </article>
  )
}

function AnalysisPage() {
  const { runId } = useParams()
  const resolvedRunId = runId ?? ''
  const { data: analysis, isLoading, error } = useQuery({
    queryKey: ['analysis', resolvedRunId],
    queryFn: () => getAnalysis(resolvedRunId),
  })

  const sortedSegments = useMemo(() => {
    if (!analysis) {
      return []
    }

    return [...analysis.segment_reactions].sort((left, right) => {
      return right.simulated_share - left.simulated_share
    })
  }, [analysis])

  if (isLoading) {
    return (
      <div className="page-container page-container-wide analysis-page">
        <div className="loading-container">
          <div className="loading-spinner" />
        </div>
      </div>
    )
  }

  if (error || !analysis) {
    return (
      <div className="page-container analysis-page">
        <Link to={`/runs/${resolvedRunId}`} className="back-link">
          Back to Run
        </Link>
        <div className="error-state">
          <div className="error-state-title">Failed to load analysis</div>
          <div>{error instanceof Error ? error.message : 'Unknown error'}</div>
        </div>
      </div>
    )
  }

  const sectionLinks = [
    { id: 'overview', label: 'Overview' },
    { id: 'signals', label: 'Signals' },
    { id: 'segments', label: 'Segments' },
    { id: 'themes', label: 'Themes' },
    ...(analysis.recommended_rewrite ? [{ id: 'rewrite', label: 'Rewrite' }] : []),
  ]

  return (
    <div className="page-container page-container-wide analysis-page">
      <div className="animate-reveal">
        <Link to={`/runs/${resolvedRunId}`} className="back-link">
          Back to Run
        </Link>
        <h1 className="page-title">Audience Reaction Analysis</h1>
        <p className="page-subtitle analysis-page-subtitle">
          Directional signal from a simulated social audience, intended to sharpen
          judgement rather than replace it.
        </p>
      </div>

      <nav className="analysis-nav animate-fade" aria-label="Analysis sections">
        {sectionLinks.map((link) => (
          <a key={link.id} href={`#${link.id}`} className="analysis-nav-link">
            {link.label}
          </a>
        ))}
      </nav>

      <section id="overview" className="analysis-hero card card-elevated animate-scale">
        <div className="analysis-hero-copy">
          <span
            className={`analysis-recommendation-pill analysis-recommendation-${analysis.overall_recommendation}`}
          >
            {analysis.overall_recommendation}
          </span>
          <h2 className="analysis-hero-title">
            {RECOMMENDATION_COPY[analysis.overall_recommendation]}
          </h2>
          <p className="analysis-hero-subtitle">
            Confidence: <strong>{analysis.confidence_label}</strong>. Generated{' '}
            {formatDateTime(analysis.created_at)}.
          </p>
        </div>

        <div className="analysis-hero-side">
          <article className="analysis-side-card">
            <span className="analysis-side-label">Best fit segments</span>
            <TagList
              items={analysis.best_fit_segments}
              variant="positive"
              emptyCopy="No clear best-fit segment surfaced."
            />
          </article>
          <article className="analysis-side-card">
            <span className="analysis-side-label">Risky segments</span>
            <TagList
              items={analysis.risky_segments}
              variant="negative"
              emptyCopy="No standout risk cluster surfaced."
            />
          </article>
        </div>
      </section>

      <section id="signals" className="analysis-section card">
        <div className="analysis-section-header">
          <div>
            <span className="analysis-section-eyebrow">Signal</span>
            <h2 className="analysis-section-title">Directional Metrics</h2>
          </div>
          <p className="analysis-section-copy">
            These scores summarize how the message performed across the simulated
            audience.
          </p>
        </div>

        <div className="analysis-metric-grid">
          <MetricCard
            label="Engagement"
            description={METRIC_COPY.predicted_engagement}
            value={analysis.predicted_engagement}
          />
          <MetricCard
            label="Shareability"
            description={METRIC_COPY.predicted_shareability}
            value={analysis.predicted_shareability}
          />
          <MetricCard
            label="Conversion"
            description={METRIC_COPY.predicted_conversion_signal}
            value={analysis.predicted_conversion_signal}
          />
          <MetricCard
            label="Trust"
            description={METRIC_COPY.predicted_trust}
            value={analysis.predicted_trust}
          />
        </div>
      </section>

      <section id="segments" className="analysis-section card">
        <div className="analysis-section-header">
          <div>
            <span className="analysis-section-eyebrow">Audience</span>
            <h2 className="analysis-section-title">Segment Reactions</h2>
          </div>
          <p className="analysis-section-copy">
            Segments are ordered by simulated audience share so the largest reactions
            stay first.
          </p>
        </div>

        <div className="analysis-segment-grid">
          {sortedSegments.map((segment) => (
            <SegmentCard key={segment.segment} segment={segment} />
          ))}
        </div>
      </section>

      <section id="themes" className="analysis-section card">
        <div className="analysis-section-header">
          <div>
            <span className="analysis-section-eyebrow">Themes</span>
            <h2 className="analysis-section-title">Overall Themes</h2>
          </div>
          <p className="analysis-section-copy">
            Cross-segment patterns that explain why the audience moved toward or away
            from the message.
          </p>
        </div>

        <div className="analysis-theme-grid">
          <article className="analysis-theme-card">
            <h3 className="analysis-theme-title">Positive themes</h3>
            <TagList
              items={analysis.top_positive_themes}
              variant="positive"
              emptyCopy="No recurring positive theme surfaced."
            />
          </article>
          <article className="analysis-theme-card">
            <h3 className="analysis-theme-title">Negative themes</h3>
            <TagList
              items={analysis.top_negative_themes}
              variant="negative"
              emptyCopy="No recurring negative theme surfaced."
            />
          </article>
          <article className="analysis-theme-card">
            <h3 className="analysis-theme-title">Top objections</h3>
            <TagList
              items={analysis.top_objections}
              variant="warning"
              emptyCopy="No repeated objection cluster surfaced."
            />
          </article>
        </div>
      </section>

      {analysis.recommended_rewrite && (
        <section id="rewrite" className="analysis-section card analysis-rewrite-section">
          <div className="analysis-section-header">
            <div>
              <span className="analysis-section-eyebrow">Rewrite</span>
              <h2 className="analysis-section-title">Recommended Rewrite</h2>
            </div>
            <p className="analysis-section-copy">
              A suggested next draft based on the strongest recurring signals in the
              simulation.
            </p>
          </div>

          <div className="analysis-rewrite-card">{analysis.recommended_rewrite}</div>
        </section>
      )}
    </div>
  )
}

export default AnalysisPage
