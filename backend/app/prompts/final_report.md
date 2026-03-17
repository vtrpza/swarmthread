You are analyzing the output of a synthetic social media simulation for SwarmThread.

Your task is to estimate likely real-world marketing impact based on simulated audience reactions.

This is a directional decision-support analysis, not a guaranteed forecast.
Be evidence-based, conservative, and explicit about mixed signals.

## Campaign Details

Title: {{title}}
Brand: {{brand}}
Goal: {{goal}}
Message: {{message}}
Call to Action: {{cta}}
Tone: {{tone}}
Target Audience: {{audience_segments}}

## Simulation Summary

Total Agents: {{agent_count}}
Total Rounds: {{round_count}}
Total Posts: {{total_posts}}
Total Likes: {{total_likes}}
Total Replies: {{total_replies}}
Total Follows: {{total_follows}}

## Segment Summaries

{{segment_summaries}}

## Key Posts and Threads

{{key_posts}}

## Scoring Rubric

Use conservative scoring based on the evidence provided.

- 0.00-0.20 = very weak signal
- 0.21-0.40 = weak signal
- 0.41-0.60 = mixed or uncertain signal
- 0.61-0.80 = strong signal
- 0.81-1.00 = very strong signal

Do not assign high scores unless the simulation shows repeated and consistent positive evidence.

## Confidence Label Rules

- low: sparse, noisy, or contradictory evidence
- medium: some stable patterns, but still mixed or incomplete
- high: repeated, consistent patterns across threads or segments

## Analysis Instructions

Analyze the simulation as a directional estimate of audience reaction.

Provide:

1. Predicted Engagement (0.0-1.0)
2. Predicted Shareability (0.0-1.0)
3. Predicted Conversion Signal (0.0-1.0)
4. Predicted Trust (0.0-1.0)
5. Overall Recommendation: `ship`, `revise`, or `avoid`
6. Confidence Label: `low`, `medium`, or `high`
7. Best Fit Segments: 2-4 segments where the message performs best
8. Risky Segments: 2-4 segments where the message performs weakest
9. Segment Reactions: for each major segment, provide:
   - segment
   - simulated_share (0.0-1.0)
   - reaction (`positive`, `mixed`, `negative`)
   - summary
   - key_resonators (2-4)
   - key_objections (2-4)
   - representative_posts (1-3 grounded short excerpts or paraphrased excerpts)
10. Top Positive Themes: 3-5
11. Top Negative Themes: 3-5
12. Top Objections: 3-5
13. Recommended Rewrite: improve the original message while preserving goal, CTA, and tone

## Evidence Rules

- Base conclusions only on the supplied simulation evidence.
- Do not invent segment behaviors not supported by the input.
- If evidence is mixed, reflect that in both scores and confidence.
- Representative posts must be grounded in the provided simulation content.
- Prefer cautious interpretation over inflated optimism.

## Rewrite Rules

The `recommended_rewrite` must:
- preserve the campaign goal
- preserve the CTA
- maintain the intended tone
- address the strongest objections
- improve clarity and credibility
- stay reasonably close to the original positioning

## Response Format

Return ONLY a JSON object matching this schema:

{
  "predicted_engagement": 0.0,
  "predicted_shareability": 0.0,
  "predicted_conversion_signal": 0.0,
  "predicted_trust": 0.0,
  "overall_recommendation": "ship|revise|avoid",
  "confidence_label": "low|medium|high",
  "best_fit_segments": ["segment1", "segment2"],
  "risky_segments": ["segment1", "segment2"],
  "segment_reactions": [
    {
      "segment": "performance marketer",
      "simulated_share": 0.25,
      "reaction": "positive|mixed|negative",
      "summary": "string",
      "key_resonators": ["string"],
      "key_objections": ["string"],
      "representative_posts": ["string"]
    }
  ],
  "top_positive_themes": ["string"],
  "top_negative_themes": ["string"],
  "top_objections": ["string"],
  "recommended_rewrite": "string"
}