import time
from typing import Any

from openai import OpenAI
from pydantic import BaseModel

from app.config import settings
from app.logging import get_logger

logger = get_logger(__name__)


class OpenRouterClient:
    def __init__(self):
        self.client = OpenAI(
            base_url=settings.openrouter_base_url,
            api_key=settings.openrouter_api_key,
        )
        self.default_model = settings.default_model
        self._langfuse_enabled = bool(
            settings.langfuse_public_key and settings.langfuse_secret_key
        )

    def parse(
        self,
        messages: list[dict[str, str]],
        response_model: type[BaseModel],
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        run_id: str | None = None,
        agent_id: str | None = None,
        stage: str | None = None,
    ) -> tuple[BaseModel, dict[str, Any]]:
        start_time = time.time()
        model = model or self.default_model

        try:
            if self._langfuse_enabled:
                result, metadata = self._parse_with_tracing(
                    messages=messages,
                    response_model=response_model,
                    model=model,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    run_id=run_id,
                    agent_id=agent_id,
                    stage=stage,
                )
            else:
                result, metadata = self._parse_without_tracing(
                    messages=messages,
                    response_model=response_model,
                    model=model,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    start_time=start_time,
                )

            latency_ms = int((time.time() - start_time) * 1000)
            metadata["latency_ms"] = latency_ms

            logger.info(
                "openrouter_parse_success",
                model=model,
                latency_ms=latency_ms,
                prompt_tokens=metadata.get("prompt_tokens"),
                completion_tokens=metadata.get("completion_tokens"),
            )

            return result, metadata

        except Exception as e:
            latency_ms = int((time.time() - start_time) * 1000)
            logger.error(
                "openrouter_parse_error",
                model=model,
                error=str(e),
                latency_ms=latency_ms,
            )
            raise

    def _parse_without_tracing(
        self,
        messages: list[dict[str, str]],
        response_model: type[BaseModel],
        model: str,
        temperature: float,
        max_tokens: int,
        start_time: float,
    ) -> tuple[BaseModel, dict[str, Any]]:
        response = self.client.chat.completions.parse(
            model=model,
            messages=messages,
            response_format=response_model,
            temperature=temperature,
            max_tokens=max_tokens,
        )

        usage = response.usage
        if usage:
            metadata = {
                "prompt_tokens": usage.prompt_tokens,
                "completion_tokens": usage.completion_tokens,
                "total_tokens": usage.total_tokens,
            }
        else:
            metadata = {}

        parsed = response.choices[0].message.parsed
        if parsed is None:
            raise ValueError("No parsed response from model")

        return parsed, metadata

    def _parse_with_tracing(
        self,
        messages: list[dict[str, str]],
        response_model: type[BaseModel],
        model: str,
        temperature: float,
        max_tokens: int,
        run_id: str | None,
        agent_id: str | None,
        stage: str | None,
    ) -> tuple[BaseModel, dict[str, Any]]:
        from langfuse import Langfuse
        from langfuse.decorators import observe

        langfuse_client = Langfuse.instance

        @observe(as_type="generation")
        def _call_llm():
            return self.client.chat.completions.parse(
                model=model,
                messages=messages,
                response_format=response_model,
                temperature=temperature,
                max_tokens=max_tokens,
            )

        langfuse_client.update_current_trace(
            name=f"llm_call_{stage or 'unknown'}",
            metadata={
                "run_id": run_id,
                "agent_id": agent_id,
                "stage": stage,
                "model": model,
            },
        )

        response = _call_llm()

        usage = response.usage
        if usage:
            metadata = {
                "prompt_tokens": usage.prompt_tokens,
                "completion_tokens": usage.completion_tokens,
                "total_tokens": usage.total_tokens,
            }
        else:
            metadata = {}

        parsed = response.choices[0].message.parsed
        if parsed is None:
            raise ValueError("No parsed response from model")

        return parsed, metadata
