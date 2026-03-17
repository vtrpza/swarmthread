from pydantic import BaseModel, Field


class AnalysisResult(BaseModel):
    predicted_engagement: float = Field(ge=0.0, le=1.0)
    predicted_shareability: float = Field(ge=0.0, le=1.0)
    predicted_conversion_signal: float = Field(ge=0.0, le=1.0)
    predicted_trust: float = Field(ge=0.0, le=1.0)
    top_positive_themes: list[str] = Field(default_factory=list)
    top_negative_themes: list[str] = Field(default_factory=list)
    top_objections: list[str] = Field(default_factory=list)
    recommended_rewrite: str | None = None


class CostGuard:
    def __init__(self, max_total_cost_usd: float):
        self.max_total_cost_usd = max_total_cost_usd
        self.total_cost_usd = 0.0

    def check_cost(self, estimated_cost: float) -> bool:
        return (self.total_cost_usd + estimated_cost) <= self.max_total_cost_usd

    def add_cost(self, cost: float) -> None:
        self.total_cost_usd += cost

    def should_cancel(self) -> bool:
        return self.total_cost_usd >= self.max_total_cost_usd
