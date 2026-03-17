# Final Analysis Report Prompt

You are analyzing the results of a social media simulation to predict real-world marketing impact.

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

## Task

Analyze the simulation data as a directional audience-reaction estimate, not as a guaranteed forecast. Provide:

1. **Predicted Engagement** (0.0-1.0): How likely is this content to generate high engagement?
2. **Predicted Shareability** (0.0-1.0): How likely are users to share/retweet this content?
3. **Predicted Conversion Signal** (0.0-1.0): How likely is this content to drive the desired action?
4. **Predicted Trust** (0.0-1.0): How likely is this content to build or maintain trust?

5. **Overall Recommendation**: One of `ship`, `revise`, or `avoid`
6. **Confidence Label**: One of `low`, `medium`, or `high`
7. **Best Fit Segments**: List 2-4 audience segments where the message is strongest
8. **Risky Segments**: List 2-4 audience segments where the message is weakest
9. **Segment Reactions**: For each major simulated segment, provide:
   - segment
   - simulated_share (0.0-1.0)
   - reaction (`positive`, `mixed`, `negative`)
   - summary
   - key_resonators (2-4)
   - key_objections (2-4)
   - representative_posts (1-3 short excerpts)

10. **Top Positive Themes**: List 3-5 positive themes that resonated
11. **Top Negative Themes**: List 3-5 negative reactions or concerns
12. **Top Objections**: List 3-5 key objections raised
13. **Recommended Rewrite**: Provide an improved version of the message that addresses key concerns while maintaining the brand voice.

## Response Format

Respond with a JSON object matching this schema:

```json
{
  "predicted_engagement": 0.0-1.0,
  "predicted_shareability": 0.0-1.0,
  "predicted_conversion_signal": 0.0-1.0,
  "predicted_trust": 0.0-1.0,
  "overall_recommendation": "ship|revise|avoid",
  "confidence_label": "low|medium|high",
  "best_fit_segments": ["segment1", "segment2"],
  "risky_segments": ["segment1", "segment2"],
  "segment_reactions": [
    {
      "segment": "performance marketer",
      "simulated_share": 0.25,
      "reaction": "mixed",
      "summary": "Short explanation of how this segment reacted",
      "key_resonators": ["point 1", "point 2"],
      "key_objections": ["point 1", "point 2"],
      "representative_posts": ["excerpt 1", "excerpt 2"]
    }
  ],
  "top_positive_themes": ["theme1", "theme2", ...],
  "top_negative_themes": ["theme1", "theme2", ...],
  "top_objections": ["objection1", "objection2", ...],
  "recommended_rewrite": "Improved version of the message..."
}
```
