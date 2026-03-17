from app.logging import get_logger

logger = get_logger(__name__)

PERSONA_ARCHETYPES = [
    {
        "segment_label": "performance marketer",
        "name": "performance_marketer",
        "display_name": "Performance Pro",
        "description": (
            "Data-driven marketer focused on ROI and conversion metrics. "
            "Skeptical of fluffy content."
        ),
        "stance_bias": "skeptical",
        "verbosity_bias": "concise",
        "skepticism_bias": "high",
        "sentence_length": "short",
        "directness": "high",
        "emotional_intensity": "low",
        "jargon_use": "high",
        "ask_vs_assert": "asserts more than asks",
        "social_confidence": "high",
    },
    {
        "segment_label": "brand strategist",
        "name": "brand_strategist",
        "display_name": "Brand Strategist",
        "description": (
            "Focuses on long-term brand perception and narrative. "
            "Values authenticity and storytelling."
        ),
        "stance_bias": "neutral",
        "verbosity_bias": "moderate",
        "skepticism_bias": "medium",
        "sentence_length": "medium",
        "directness": "medium",
        "emotional_intensity": "medium",
        "jargon_use": "medium",
        "ask_vs_assert": "balanced between asking and asserting",
        "social_confidence": "high",
    },
    {
        "segment_label": "skeptical founder",
        "name": "skeptical_founder",
        "display_name": "Skeptical Founder",
        "description": (
            "Technical founder who questions marketing claims. "
            "Values substance over style."
        ),
        "stance_bias": "critical",
        "verbosity_bias": "concise",
        "skepticism_bias": "very_high",
        "sentence_length": "short",
        "directness": "very high",
        "emotional_intensity": "low",
        "jargon_use": "medium",
        "ask_vs_assert": "asks sharp questions before asserting",
        "social_confidence": "high",
    },
    {
        "segment_label": "agency lead",
        "name": "agency_lead",
        "display_name": "Agency Lead",
        "description": (
            "Experienced agency professional who has seen many campaigns. "
            "Pragmatic about results."
        ),
        "stance_bias": "neutral",
        "verbosity_bias": "moderate",
        "skepticism_bias": "medium",
        "sentence_length": "medium",
        "directness": "high",
        "emotional_intensity": "low",
        "jargon_use": "medium",
        "ask_vs_assert": "balanced but leans assertive",
        "social_confidence": "high",
    },
    {
        "segment_label": "data scientist",
        "name": "data_scientist",
        "display_name": "Data Scientist",
        "description": (
            "Analytical thinker who looks for evidence and patterns. "
            "Questions assumptions."
        ),
        "stance_bias": "curious",
        "verbosity_bias": "detailed",
        "skepticism_bias": "high",
        "sentence_length": "long",
        "directness": "medium",
        "emotional_intensity": "low",
        "jargon_use": "high",
        "ask_vs_assert": "asks probing questions",
        "social_confidence": "medium",
    },
    {
        "segment_label": "cynical operator",
        "name": "cynical_operator",
        "display_name": "Cynical Operator",
        "description": (
            "Operations-focused individual who cuts through hype. "
            "Values practical outcomes."
        ),
        "stance_bias": "critical",
        "verbosity_bias": "concise",
        "skepticism_bias": "very_high",
        "sentence_length": "very short",
        "directness": "very high",
        "emotional_intensity": "medium",
        "jargon_use": "low",
        "ask_vs_assert": "asserts bluntly",
        "social_confidence": "high",
    },
    {
        "segment_label": "enthusiastic early adopter",
        "name": "enthusiastic_adopter",
        "display_name": "Early Adopter",
        "description": (
            "Excited about new technologies and approaches. Tends to be supportive."
        ),
        "stance_bias": "supportive",
        "verbosity_bias": "verbose",
        "skepticism_bias": "low",
        "sentence_length": "medium to long",
        "directness": "medium",
        "emotional_intensity": "high",
        "jargon_use": "medium",
        "ask_vs_assert": "mixes excited assertions with open questions",
        "social_confidence": "high",
    },
    {
        "segment_label": "competitor-adjacent voice",
        "name": "competitor_adjacent",
        "display_name": "Competitor Voice",
        "description": "Works in a similar space. May offer comparative perspectives.",
        "stance_bias": "skeptical",
        "verbosity_bias": "moderate",
        "skepticism_bias": "medium",
        "sentence_length": "medium",
        "directness": "high",
        "emotional_intensity": "low",
        "jargon_use": "high",
        "ask_vs_assert": "asks comparative questions before asserting",
        "social_confidence": "high",
    },
    {
        "segment_label": "creator/influencer type",
        "name": "creator_influencer",
        "display_name": "Content Creator",
        "description": (
            "Creates content and values engagement. Interested in what resonates."
        ),
        "stance_bias": "neutral",
        "verbosity_bias": "verbose",
        "skepticism_bias": "low",
        "sentence_length": "medium to long",
        "directness": "medium",
        "emotional_intensity": "medium to high",
        "jargon_use": "low",
        "ask_vs_assert": "asks often to invite reaction",
        "social_confidence": "medium to high",
    },
    {
        "segment_label": "casual observer",
        "name": "casual_observer",
        "display_name": "Casual Observer",
        "description": (
            "General audience member with no specific expertise. "
            "Reacts based on gut feeling."
        ),
        "stance_bias": "neutral",
        "verbosity_bias": "moderate",
        "skepticism_bias": "medium",
        "sentence_length": "short to medium",
        "directness": "low to medium",
        "emotional_intensity": "medium",
        "jargon_use": "low",
        "ask_vs_assert": "asks more than asserts",
        "social_confidence": "medium",
    },
]

PERSONA_BY_SEGMENT = {
    persona["segment_label"]: persona for persona in PERSONA_ARCHETYPES
}
PERSONA_BY_NAME = {persona["name"]: persona for persona in PERSONA_ARCHETYPES}

BASELINE_SEGMENTS = [
    "casual observer",
    "creator/influencer type",
]

DEFAULT_SEGMENT_WEIGHTS = {
    "casual observer": 0.30,
    "brand strategist": 0.20,
    "skeptical founder": 0.20,
    "performance marketer": 0.15,
    "creator/influencer type": 0.15,
}


def normalize_segment_label(value: str) -> str:
    return value.strip().lower()


def resolve_segments(selected_segments: list[str] | None) -> list[str]:
    if not selected_segments:
        return []

    normalized = []
    seen: set[str] = set()
    for segment in selected_segments:
        label = normalize_segment_label(segment)
        if label in PERSONA_BY_SEGMENT and label not in seen:
            normalized.append(label)
            seen.add(label)
    return normalized


def persona_for_name(name: str) -> dict | None:
    return PERSONA_BY_NAME.get(name)


def voice_profile_for_persona(name: str) -> dict[str, str]:
    persona = persona_for_name(name) or {}
    return {
        "sentence_length": str(persona.get("sentence_length", "medium")),
        "directness": str(persona.get("directness", "medium")),
        "emotional_intensity": str(persona.get("emotional_intensity", "medium")),
        "jargon_use": str(persona.get("jargon_use", "medium")),
        "ask_vs_assert": str(
            persona.get("ask_vs_assert", "balanced between asking and asserting")
        ),
        "social_confidence": str(persona.get("social_confidence", "medium")),
    }


def segment_for_persona_name(name: str) -> str:
    persona = persona_for_name(name)
    return persona["segment_label"] if persona else name.replace("_", " ")


def _allocate_persona_counts(
    weights: dict[str, float], agent_count: int
) -> dict[str, int]:
    allocations: dict[str, int] = dict.fromkeys(weights, 0)
    raw_counts = {segment: agent_count * weight for segment, weight in weights.items()}

    for segment, raw_count in raw_counts.items():
        allocations[segment] = int(raw_count)

    remaining = agent_count - sum(allocations.values())
    remainders = sorted(
        raw_counts.items(),
        key=lambda item: item[1] - int(item[1]),
        reverse=True,
    )

    for index in range(remaining):
        segment = remainders[index % len(remainders)][0]
        allocations[segment] += 1

    return allocations


def select_personas(
    selected_segments: list[str] | None, agent_count: int
) -> list[dict]:
    normalized_segments = resolve_segments(selected_segments)

    if normalized_segments:
        selected_share = 0.8 / len(normalized_segments)
        baseline_share = 0.2 / len(BASELINE_SEGMENTS)
        weights = dict.fromkeys(normalized_segments, selected_share)
        for baseline_segment in BASELINE_SEGMENTS:
            weights[baseline_segment] = (
                weights.get(baseline_segment, 0.0) + baseline_share
            )
    else:
        weights = DEFAULT_SEGMENT_WEIGHTS

    allocations = _allocate_persona_counts(weights, agent_count)
    personas: list[dict] = []

    for segment in weights:
        persona = PERSONA_BY_SEGMENT[segment]
        personas.extend([persona] * allocations[segment])

    return personas[:agent_count]


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
