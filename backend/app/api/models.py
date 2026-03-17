from fastapi import APIRouter, Header, HTTPException
from openai import AsyncOpenAI
from pydantic import BaseModel

from app.config import settings
from app.logging import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/models", tags=["models"])


class ModelInfo(BaseModel):
    id: str
    name: str
    context_length: int | None = None
    pricing: dict[str, float] | None = None


class ValidateKeyRequest(BaseModel):
    pass


class ValidateKeyResponse(BaseModel):
    valid: bool
    error: str | None = None


@router.get("/", response_model=list[ModelInfo])
async def list_models(
    x_openrouter_key: str | None = Header(None),
) -> list[ModelInfo]:
    api_key = x_openrouter_key or settings.openrouter_api_key
    if not api_key:
        raise HTTPException(status_code=401, detail="API key required")

    client = AsyncOpenAI(base_url=settings.openrouter_base_url, api_key=api_key)

    try:
        response = await client.models.list()
        models = []
        for model in response.data:
            model_info = ModelInfo(
                id=model.id,
                name=model.id,
                context_length=getattr(model, "context_length", None),
                pricing=None,
            )
            models.append(model_info)
        return models
    except Exception as e:
        logger.error("list_models_error", error=str(e))
        raise HTTPException(
            status_code=500, detail=f"Failed to list models: {str(e)}"
        ) from None


@router.post("/validate-key", response_model=ValidateKeyResponse)
async def validate_api_key(x_openrouter_key: str = Header(...)) -> dict:
    if not x_openrouter_key:
        return {"valid": False, "error": "API key required"}

    client = AsyncOpenAI(
        base_url=settings.openrouter_base_url, api_key=x_openrouter_key
    )

    try:
        await client.models.list()
        return {"valid": True, "error": None}
    except Exception as e:
        error_str = str(e)
        if "401" in error_str or "unauthorized" in error_str.lower():
            return {"valid": False, "error": "Invalid API key"}
        elif "403" in error_str or "forbidden" in error_str.lower():
            return {"valid": False, "error": "API key lacks required permissions"}
        else:
            return {"valid": False, "error": f"Validation failed: {error_str}"}
