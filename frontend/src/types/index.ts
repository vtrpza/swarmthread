export type RunStatus = "queued" | "running" | "completed" | "failed" | "cancelled"

export type Stance = "supportive" | "skeptical" | "neutral" | "critical" | "curious"

export interface Run {
  id: string
  status: RunStatus
  agent_count: number
  round_count: number
  model_name: string
  max_total_cost_usd: number
  created_at: string
  started_at: string | null
  completed_at: string | null
  error_message: string | null
  title: string
  brand: string
  goal: string
  audience_segments: string[]
}

export interface RunSeed {
  title?: string
  brand: string
  goal: string
  content_type?: string
  message: string
  cta?: string
  tone?: string
  audience_segments?: string[]
}

export interface RunCreate {
  title?: string
  brand: string
  goal: string
  content_type?: string
  message: string
  cta?: string
  tone?: string
  audience_segments?: string[]
  simulation_preset?: SimulationPreset
  agent_count?: number
  round_count?: number
  model_name?: string
  max_total_cost_usd?: number
}

export type SimulationPreset = "quick" | "standard" | "deep"

export interface Agent {
  id: string
  handle: string
  display_name: string
  persona_name: string
  persona_description: string
  stance_bias: string
  verbosity_bias: string
  skepticism_bias: string
  created_at: string
}

export interface AgentProfile {
  agent_id: string
  handle: string
  display_name: string
  persona_name: string
  persona_description: string
  stance_bias: string
  post_count: number
  reply_count: number
  like_count: number
  follow_count: number
  created_at: string
}

export interface FeedItem {
  post_id: string
  author_agent_id: string
  author_handle: string
  author_display_name: string
  content: string
  stance: string
  like_count: number
  reply_count: number
  round_number: number
  parent_post_id: string | null
  created_at: string
}

export interface FeedResponse {
  items: FeedItem[]
  total: number
}

export interface ThreadItem {
  post_id: string
  author_agent_id: string
  author_handle: string
  content: string
  stance: string
  like_count: number
  reply_count: number
  round_number: number
  created_at: string
  replies: ThreadItem[]
}

export interface ThreadResponse {
  root: ThreadItem
}

export interface AgentResponse {
  profile: AgentProfile
  posts: FeedItem[]
}

export interface AnalysisReport {
  id: string
  run_id: string
  predicted_engagement: number
  predicted_shareability: number
  predicted_conversion_signal: number
  predicted_trust: number
  overall_recommendation: "ship" | "revise" | "avoid"
  confidence_label: "low" | "medium" | "high"
  best_fit_segments: string[]
  risky_segments: string[]
  segment_reactions: SegmentReaction[]
  top_positive_themes: string[]
  top_negative_themes: string[]
  top_objections: string[]
  recommended_rewrite: string | null
  created_at: string
}

export interface SegmentReaction {
  segment: string
  simulated_share: number
  reaction: "positive" | "mixed" | "negative"
  summary: string
  key_resonators: string[]
  key_objections: string[]
  representative_posts: string[]
}

export const AUDIENCE_SEGMENTS = [
  "performance marketer",
  "brand strategist",
  "skeptical founder",
  "agency lead",
  "data scientist",
  "cynical operator",
  "enthusiastic early adopter",
  "competitor-adjacent voice",
  "creator/influencer type",
  "casual observer",
] as const

export const CONTENT_TYPES = [
  "thought_leadership",
  "product_launch",
  "educational",
  "promotional",
  "announcement",
] as const

export const SIMULATION_PRESETS: Record<
  SimulationPreset,
  { label: string; agentCount: number; roundCount: number }
> = {
  quick: { label: "Quick", agentCount: 12, roundCount: 60 },
  standard: { label: "Standard", agentCount: 24, roundCount: 120 },
  deep: { label: "Deep", agentCount: 40, roundCount: 200 },
}
