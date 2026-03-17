import re
from difflib import SequenceMatcher
from uuid import UUID

from pydantic import BaseModel

from app.models import ActionType, Post
from app.services.action_validator import AgentAction

TOKEN_RE = re.compile(r"[a-z0-9']+")


class NoveltyCheck(BaseModel):
    accepted: bool
    reason: str | None = None


class ContentNoveltyGuard:
    self_similarity_threshold = 0.82
    ancestor_similarity_threshold = 0.78
    repeated_progress_similarity_threshold = 0.58
    opening_phrase_words = 4
    recent_content_limit = 5

    def evaluate(
        self,
        action: AgentAction,
        agent_id: UUID,
        posts: list[Post],
        post_map: dict[UUID, Post],
        recent_actions: list[dict[str, str | int | None]],
    ) -> NoveltyCheck:
        if (
            action.action not in (ActionType.post, ActionType.reply)
            or action.content is None
        ):
            return NoveltyCheck(accepted=True)

        candidate_opening = self.opening_phrase(action.content)
        recent_authored_actions = [
            entry for entry in recent_actions if entry.get("content_excerpt")
        ]

        if candidate_opening and any(
            entry.get("opening_phrase") == candidate_opening
            for entry in recent_authored_actions[-3:]
        ):
            return NoveltyCheck(
                accepted=False,
                reason="draft starts with the same opening phrase as a recent action",
            )

        recent_agent_posts = [
            post
            for post in posts
            if post.author_agent_id == agent_id and post.content.strip()
        ][-self.recent_content_limit :]
        for post in recent_agent_posts:
            similarity = self.lexical_similarity(action.content, post.content)
            if similarity >= self.self_similarity_threshold:
                return NoveltyCheck(
                    accepted=False,
                    reason=(
                        "draft is too similar to the agent's recent content "
                        f"(similarity {similarity:.2f})"
                    ),
                )

        if action.action == ActionType.reply and action.target_post_id is not None:
            for ancestor in self._thread_ancestors(action.target_post_id, post_map):
                similarity = self.lexical_similarity(action.content, ancestor.content)
                if similarity >= self.ancestor_similarity_threshold:
                    return NoveltyCheck(
                        accepted=False,
                        reason=(
                            "draft is echoing a recent thread ancestor "
                            f"(similarity {similarity:.2f})"
                        ),
                    )

            thread_root_id = post_map[action.target_post_id].root_post_id
            thread_actions = [
                entry
                for entry in recent_authored_actions
                if entry.get("root_post_id") == str(thread_root_id)
            ]
            if thread_actions:
                last_thread_action = thread_actions[-1]
                if (
                    action.progress_type is not None
                    and last_thread_action.get("progress_type")
                    == action.progress_type.value
                ):
                    reference_excerpt = str(
                        last_thread_action.get("content_excerpt") or ""
                    )
                    similarity = self.lexical_similarity(
                        action.content, reference_excerpt
                    )
                    distinctive_ratio = self.distinctive_token_ratio(
                        action.content,
                        reference_excerpt,
                    )
                    if (
                        similarity >= self.repeated_progress_similarity_threshold
                        or distinctive_ratio < 0.35
                    ):
                        return NoveltyCheck(
                            accepted=False,
                            reason=(
                                "draft repeats the same progress_type in the same "
                                "thread without a clear new angle"
                            ),
                        )

        return NoveltyCheck(accepted=True)

    def fallback_action(
        self,
        action: AgentAction,
        liked_post_ids: set[UUID],
    ) -> AgentAction:
        if (
            action.action == ActionType.reply
            and action.target_post_id is not None
            and action.target_post_id not in liked_post_ids
        ):
            return action.model_copy(
                update={
                    "action": ActionType.like,
                    "content": None,
                    "progress_type": None,
                    "target_agent_id": None,
                }
            )

        return action.model_copy(
            update={
                "action": ActionType.idle,
                "target_post_id": None,
                "target_agent_id": None,
                "content": None,
                "progress_type": None,
            }
        )

    def lexical_similarity(self, left: str, right: str) -> float:
        left_normalized = self.normalize_text(left)
        right_normalized = self.normalize_text(right)
        if not left_normalized or not right_normalized:
            return 0.0

        sequence_ratio = SequenceMatcher(
            None,
            left_normalized,
            right_normalized,
        ).ratio()
        left_tokens = set(self.tokenize(left_normalized))
        right_tokens = set(self.tokenize(right_normalized))
        if not left_tokens or not right_tokens:
            return sequence_ratio

        token_overlap = len(left_tokens & right_tokens) / len(
            left_tokens | right_tokens
        )
        return max(sequence_ratio, (sequence_ratio + token_overlap) / 2)

    def distinctive_token_ratio(self, candidate: str, reference: str) -> float:
        candidate_tokens = set(self.tokenize(candidate))
        if not candidate_tokens:
            return 0.0

        reference_tokens = set(self.tokenize(reference))
        return len(candidate_tokens - reference_tokens) / len(candidate_tokens)

    def opening_phrase(self, content: str) -> str | None:
        tokens = self.tokenize(content)
        if not tokens:
            return None
        return " ".join(tokens[: self.opening_phrase_words])

    def normalize_text(self, content: str) -> str:
        return " ".join(self.tokenize(content))

    def tokenize(self, content: str) -> list[str]:
        return TOKEN_RE.findall(content.lower())

    def _thread_ancestors(
        self,
        target_post_id: UUID,
        post_map: dict[UUID, Post],
    ) -> list[Post]:
        ancestors: list[Post] = []
        current = post_map.get(target_post_id)

        while current is not None:
            ancestors.append(current)
            if current.parent_post_id is None:
                break
            current = post_map.get(current.parent_post_id)

        return ancestors[-self.recent_content_limit :]
