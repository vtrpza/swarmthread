from pathlib import Path
from uuid import UUID

from app.models import Agent, Post, RunSeed


def load_prompt_template(name: str) -> str:
    prompt_path = Path(__file__).parent.parent / "prompts" / name
    return prompt_path.read_text()


def build_agent_action_prompt(
    seed: RunSeed,
    agent: Agent,
    round_number: int,
    total_rounds: int,
    recent_posts: list[Post],
    recent_actions: list[dict],
    follows: list[UUID],
) -> list[dict[str, str]]:
    template = load_prompt_template("agent_decide_action.md")

    recent_feed = (
        "\n".join(
            f"- @{p.author_agent_id}: {p.content[:200]}..."
            if len(p.content) > 200
            else f"- @{p.author_agent_id}: {p.content}"
            for p in recent_posts[-20:]
        )
        or "No recent posts."
    )

    recent_actions_str = (
        "\n".join(f"- Round {a['round']}: {a['action']}" for a in recent_actions[-10:])
        or "No recent actions."
    )

    follows_str = ", ".join(str(f) for f in follows[:10]) or "None"

    prompt = template.replace("{{title}}", seed.title)
    prompt = prompt.replace("{{brand}}", seed.brand)
    prompt = prompt.replace("{{goal}}", seed.goal)
    prompt = prompt.replace("{{message}}", seed.message)
    prompt = prompt.replace("{{cta}}", seed.cta)
    prompt = prompt.replace("{{tone}}", seed.tone)
    prompt = prompt.replace("{{audience_segments}}", ", ".join(seed.audience_segments))
    prompt = prompt.replace("{{controversy_level}}", seed.controversy_level)
    prompt = prompt.replace("{{handle}}", agent.handle)
    prompt = prompt.replace("{{display_name}}", agent.display_name)
    prompt = prompt.replace("{{persona_name}}", agent.persona_name)
    prompt = prompt.replace("{{persona_description}}", agent.persona_description)
    prompt = prompt.replace("{{stance_bias}}", agent.stance_bias)
    prompt = prompt.replace("{{verbosity_bias}}", agent.verbosity_bias)
    prompt = prompt.replace("{{skepticism_bias}}", agent.skepticism_bias)
    prompt = prompt.replace("{{round_number}}", str(round_number))
    prompt = prompt.replace("{{total_rounds}}", str(total_rounds))
    prompt = prompt.replace("{{follows}}", follows_str)
    prompt = prompt.replace("{{recent_actions}}", recent_actions_str)
    prompt = prompt.replace("{{recent_feed}}", recent_feed)

    return [
        {
            "role": "system",
            "content": (
                "You are a social media simulation agent. Respond with valid JSON only."
            ),
        },
        {"role": "user", "content": prompt},
    ]


def build_analysis_prompt(
    seed: RunSeed,
    agent_count: int,
    round_count: int,
    total_posts: int,
    total_likes: int,
    total_replies: int,
    total_follows: int,
    agent_summaries: list[dict],
    key_posts: list[dict],
    objection_patterns: list[str],
) -> list[dict[str, str]]:
    template = load_prompt_template("final_report.md")

    agent_summaries_str = "\n".join(
        f"- {a['handle']}: {a['persona_name']} - {a['stance_bias']}"
        f" stance, {a['post_count']} posts"
        for a in agent_summaries
    )

    key_posts_str = (
        "\n".join(
            f"- @{p['author']}: {p['content'][:300]}..."
            if len(p["content"]) > 300
            else f"- @{p['author']}: {p['content']}"
            for p in key_posts[:20]
        )
        or "No key posts identified."
    )

    objections_str = (
        "\n".join(f"- {o}" for o in objection_patterns[:10])
        or "No significant objections raised."
    )

    prompt = template.replace("{{title}}", seed.title)
    prompt = prompt.replace("{{brand}}", seed.brand)
    prompt = prompt.replace("{{goal}}", seed.goal)
    prompt = prompt.replace("{{message}}", seed.message)
    prompt = prompt.replace("{{cta}}", seed.cta)
    prompt = prompt.replace("{{tone}}", seed.tone)
    prompt = prompt.replace("{{audience_segments}}", ", ".join(seed.audience_segments))
    prompt = prompt.replace("{{agent_count}}", str(agent_count))
    prompt = prompt.replace("{{round_count}}", str(round_count))
    prompt = prompt.replace("{{total_posts}}", str(total_posts))
    prompt = prompt.replace("{{total_likes}}", str(total_likes))
    prompt = prompt.replace("{{total_replies}}", str(total_replies))
    prompt = prompt.replace("{{total_follows}}", str(total_follows))
    prompt = prompt.replace("{{agent_personas}}", agent_summaries_str)
    prompt = prompt.replace("{{key_posts}}", key_posts_str)
    prompt = prompt.replace("{{objection_patterns}}", objections_str)

    return [
        {
            "role": "system",
            "content": (
                "You are a marketing analysis AI. Respond with valid JSON only."
            ),
        },
        {"role": "user", "content": prompt},
    ]
