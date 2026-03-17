from app.config import settings


class CostGuard:
    def __init__(self, max_total_cost_usd: float, model: str | None = None):
        self.max_total_cost_usd = max_total_cost_usd
        self.total_cost_usd = 0.0
        self.model = model or settings.default_model
        self._pricing = settings.get_model_pricing(self.model)

    def calculate_cost(self, prompt_tokens: int, completion_tokens: int) -> float:
        prompt_cost = prompt_tokens * self._pricing["prompt"] / 1_000_000
        completion_cost = completion_tokens * self._pricing["completion"] / 1_000_000
        return prompt_cost + completion_cost

    def check_cost(self, prompt_tokens: int, completion_tokens: int) -> bool:
        estimated_cost = self.calculate_cost(prompt_tokens, completion_tokens)
        return (self.total_cost_usd + estimated_cost) <= self.max_total_cost_usd

    def add_cost(self, prompt_tokens: int, completion_tokens: int) -> float:
        cost = self.calculate_cost(prompt_tokens, completion_tokens)
        self.total_cost_usd += cost
        return cost

    def should_cancel(self) -> bool:
        return self.total_cost_usd >= self.max_total_cost_usd
