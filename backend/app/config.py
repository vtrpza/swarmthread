from pydantic_settings import BaseSettings, SettingsConfigDict

MODEL_PRICING: dict[str, dict[str, float]] = {
    "qwen/qwen-plus": {"prompt": 0.40, "completion": 1.20},
    "qwen/qwen-turbo": {"prompt": 0.05, "completion": 0.20},
    "openai/gpt-4o": {"prompt": 2.50, "completion": 10.00},
    "openai/gpt-4o-mini": {"prompt": 0.15, "completion": 0.60},
    "anthropic/claude-3.5-sonnet": {"prompt": 3.00, "completion": 15.00},
    "anthropic/claude-3-haiku": {"prompt": 0.25, "completion": 1.25},
}


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str
    database_url_migrations: str | None = None
    openrouter_api_key: str
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    default_model: str = "qwen/qwen-plus"
    langfuse_public_key: str | None = None
    langfuse_secret_key: str | None = None
    langfuse_host: str = "https://cloud.langfuse.com"
    environment: str = "development"

    @property
    def effective_database_url(self) -> str:
        return self.database_url_migrations or self.database_url

    def get_model_pricing(self, model: str) -> dict[str, float]:
        return MODEL_PRICING.get(
            model,
            MODEL_PRICING.get(self.default_model, {"prompt": 0.40, "completion": 1.20}),
        )


settings = Settings()
