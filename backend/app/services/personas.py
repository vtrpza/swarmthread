from app.logging import get_logger

logger = get_logger(__name__)

PERSONA_ARCHETYPES = [
    {
        "name": "performance_marketer",
        "display_name": "Performance Pro",
        "description": (
            "Data-driven marketer focused on ROI and conversion metrics. "
            "Skeptical of fluffy content."
        ),
        "stance_bias": "skeptical",
        "verbosity_bias": "concise",
        "skepticism_bias": "high",
    },
    {
        "name": "brand_strategist",
        "display_name": "Brand Strategist",
        "description": (
            "Focuses on long-term brand perception and narrative. "
            "Values authenticity and storytelling."
        ),
        "stance_bias": "neutral",
        "verbosity_bias": "moderate",
        "skepticism_bias": "medium",
    },
    {
        "name": "skeptical_founder",
        "display_name": "Skeptical Founder",
        "description": (
            "Technical founder who questions marketing claims. "
            "Values substance over style."
        ),
        "stance_bias": "critical",
        "verbosity_bias": "concise",
        "skepticism_bias": "very_high",
    },
    {
        "name": "agency_lead",
        "display_name": "Agency Lead",
        "description": (
            "Experienced agency professional who has seen many campaigns. "
            "Pragmatic about results."
        ),
        "stance_bias": "neutral",
        "verbosity_bias": "moderate",
        "skepticism_bias": "medium",
    },
    {
        "name": "data_scientist",
        "display_name": "Data Scientist",
        "description": (
            "Analytical thinker who looks for evidence and patterns. "
            "Questions assumptions."
        ),
        "stance_bias": "curious",
        "verbosity_bias": "detailed",
        "skepticism_bias": "high",
    },
    {
        "name": "cynical_operator",
        "display_name": "Cynical Operator",
        "description": (
            "Operations-focused individual who cuts through hype. "
            "Values practical outcomes."
        ),
        "stance_bias": "critical",
        "verbosity_bias": "concise",
        "skepticism_bias": "very_high",
    },
    {
        "name": "enthusiastic_adopter",
        "display_name": "Early Adopter",
        "description": (
            "Excited about new technologies and approaches. Tends to be supportive."
        ),
        "stance_bias": "supportive",
        "verbosity_bias": "verbose",
        "skepticism_bias": "low",
    },
    {
        "name": "competitor_adjacent",
        "display_name": "Competitor Voice",
        "description": "Works in a similar space. May offer comparative perspectives.",
        "stance_bias": "skeptical",
        "verbosity_bias": "moderate",
        "skepticism_bias": "medium",
    },
    {
        "name": "creator_influencer",
        "display_name": "Content Creator",
        "description": (
            "Creates content and values engagement. Interested in what resonates."
        ),
        "stance_bias": "neutral",
        "verbosity_bias": "verbose",
        "skepticism_bias": "low",
    },
    {
        "name": "casual_observer",
        "display_name": "Casual Observer",
        "description": (
            "General audience member with no specific expertise. "
            "Reacts based on gut feeling."
        ),
        "stance_bias": "neutral",
        "verbosity_bias": "moderate",
        "skepticism_bias": "medium",
    },
]


def generate_agent_handle(index: int) -> str:
    adjectives = [
        "swift",
        "bright",
        "keen",
        "bold",
        "wise",
        "calm",
        "sharp",
        "quick",
        "cool",
        "warm",
        "fresh",
        "crisp",
        "clear",
        "deep",
        "wide",
        "high",
    ]
    nouns = [
        "fox",
        "owl",
        "crow",
        "hawk",
        "wolf",
        "bear",
        "deer",
        "finch",
        "wren",
        "moth",
        "dove",
        "crane",
        "heron",
        "lark",
        "swan",
        "robin",
    ]
    adj_idx = index % len(adjectives)
    noun_idx = (index // len(adjectives)) % len(nouns)
    return f"{adjectives[adj_idx]}_{nouns[noun_idx]}_{index + 1}"
