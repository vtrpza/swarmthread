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

## Agent Personas

{{agent_personas}}

## Key Posts and Threads

{{key_posts}}

## Objection Patterns

{{objection_patterns}}

## Task

Analyze the simulation data to predict real-world marketing impact. Provide:

1. **Predicted Engagement** (0.0-1.0): How likely is this content to generate high engagement?
2. **Predicted Shareability** (0.0-1.0): How likely are users to share/retweet this content?
3. **Predicted Conversion Signal** (0.0-1.0): How likely is this content to drive the desired action?
4. **Predicted Trust** (0.0-1.0): How likely is this content to build or maintain trust?

5. **Top Positive Themes**: List 3-5 positive themes that resonated
6. **Top Negative Themes**: List 3-5 negative reactions or concerns
7. **Top Objections**: List 3-5 key objections raised

8. **Recommended Rewrite**: Provide an improved version of the message that addresses key concerns while maintaining the brand voice.

## Response Format

Respond with a JSON object matching this schema:

```json
{
  "predicted_engagement": 0.0-1.0,
  "predicted_shareability": 0.0-1.0,
  "predicted_conversion_signal": 0.0-1.0,
  "predicted_trust": 0.0-1.0,
  "top_positive_themes": ["theme1", "theme2", ...],
  "top_negative_themes": ["theme1", "theme2", ...],
  "top_objections": ["objection1", "objection2", ...],
  "recommended_rewrite": "Improved version of the message..."
}
```