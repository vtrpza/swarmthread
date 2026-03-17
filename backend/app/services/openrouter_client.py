import asyncio
import time
from typing import Any, TypeVar

from openai import AsyncOpenAI
from pydantic import BaseModel
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from app.config import settings
from app.logging import get_logger

T = TypeVar("T", bound=BaseModel)

logger = get_logger(__name__)

_langfuse_client = None


def get_langfuse_client():
    global _langfuse_client
    if (
        _langfuse_client is None
        and settings.langfuse_public_key
        and settings.langfuse_secret_key
    ):
        from langfuse import Langfuse

        _langfuse_client = Langfuse(
            public_key=settings.langfuse_public_key,
            secret_key=settings.langfuse_secret_key,
            host=settings.langfuse_host,
        )
    return _langfuse_client


class RateLimitError(Exception):
    pass


class OpenRouterClient:
    def __init__(self, api_key: str | None = None):
        effective_key = api_key or settings.openrouter_api_key
        self.client = AsyncOpenAI(
            base_url=settings.openrouter_base_url,
            api_key=effective_key,
        )
        self.default_model = settings.default_model
        self._langfuse_enabled = bool(
            settings.langfuse_public_key and settings.langfuse_secret_key
        )
        self._semaphore = asyncio.Semaphore(settings.max_concurrent_llm_calls)

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        retry=retry_if_exception_type(RateLimitError),
    )
    async def parse(
        self,
        messages: list[dict[str, str]],
        response_model: type[T],
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        run_id: str | None = None,
        agent_id: str | None = None,
        stage: str | None = None,
    ) -> tuple[T, dict[str, Any]]:
        async with self._semaphore:
            start_time = time.time()
            model = model or self.default_model

            try:
                if self._langfuse_enabled:
                    result, metadata = await self._parse_with_tracing(
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
                    result, metadata = await self._parse_without_tracing(
                        messages=messages,
                        response_model=response_model,
                        model=model,
                        temperature=temperature,
                        max_tokens=max_tokens,
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

                return result, metadata  # type: ignore[return-value]

            except Exception as e:
                latency_ms = int((time.time() - start_time) * 1000)
                error_str = str(e)
                if "429" in error_str or "rate limit" in error_str.lower():
                    logger.warning(
                        "rate_limit_hit",
                        model=model,
                        latency_ms=latency_ms,
                        retry_after=30,
                    )
                    raise RateLimitError(error_str) from e

                logger.error(
                    "openrouter_parse_error",
                    model=model,
                    error=error_str,
                    latency_ms=latency_ms,
                )
                raise

    async def _parse_without_tracing(
        self,
        messages: list[dict[str, str]],
        response_model: type[T],
        model: str,
        temperature: float,
        max_tokens: int,
    ) -> tuple[T, dict[str, Any]]:
        response = await self.client.chat.completions.parse(
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

    async def _parse_with_tracing(
        self,
        messages: list[dict[str, str]],
        response_model: type[T],
        model: str,
        temperature: float,
        max_tokens: int,
        run_id: str | None,
        agent_id: str | None,
        stage: str | None,
    ) -> tuple[T, dict[str, Any]]:
        langfuse_client = get_langfuse_client()

        with langfuse_client.start_as_current_observation(
            as_type="generation",
            name=f"llm_call_{stage or 'unknown'}",
            input={"messages": messages, "model": model},
            metadata={
                "run_id": run_id,
                "agent_id": agent_id,
                "stage": stage,
                "model": model,
            },
        ) as observation:
            response = await self.client.chat.completions.parse(
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
                observation.update(
                    usage={
                        "input": usage.prompt_tokens,
                        "output": usage.completion_tokens,
                    }
                )
            else:
                metadata = {}

            parsed = response.choices[0].message.parsed
            if parsed is None:
                raise ValueError("No parsed response from model")

            observation.update(output={"response": parsed.model_dump()})

            return parsed, metadata
