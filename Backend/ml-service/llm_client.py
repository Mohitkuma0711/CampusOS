import json
import logging
import os
from typing import Any

import requests

from api_llm_client import APIUnavailableError
from api_llm_client import generate as generate_api
from gemini_client import generate as generate_gemini

LOGGER = logging.getLogger(__name__)
OLLAMA_DEFAULT_HOST = "http://localhost:11434"
JSON_MODEL = "qwen2.5:7b"
TEXT_MODEL = "llama3.1:8b"


class LocalLLMUnavailableError(RuntimeError):
    """Raised when Ollama cannot be reached or cannot serve a local request."""


def _ollama_host():
    return os.getenv("OLLAMA_HOST", OLLAMA_DEFAULT_HOST).rstrip("/")


def _default_model(response_format):
    configured = os.getenv("OLLAMA_MODEL_DEFAULT")
    if configured:
        return configured
    return JSON_MODEL if response_format == "json" else TEXT_MODEL


def _is_api_provider(provider):
    return (provider or os.getenv("LLM_PROVIDER", "local")).lower() == "api"


def _parse_json(content):
    try:
        return json.loads(content)
    except (TypeError, json.JSONDecodeError) as error:
        raise ValueError("Local LLM returned invalid JSON") from error


def _generate_local(prompt, response_format, model):
    payload = {"model": model, "prompt": prompt, "stream": False}
    if response_format == "json":
        payload["format"] = "json"

    last_error = None
    for attempt in range(2 if response_format == "json" else 1):
        try:
            response = requests.post(f"{_ollama_host()}/api/generate", json=payload, timeout=30)
            response.raise_for_status()
            content = response.json()["response"]
            if response_format == "json":
                try:
                    return _parse_json(content)
                except ValueError as error:
                    last_error = error
                    payload["prompt"] = f"Return only valid JSON. Retry this request:\n{prompt}"
                    continue
            return content
        except requests.RequestException as error:
            raise LocalLLMUnavailableError(
                f"Ollama is unavailable at {_ollama_host()}: {error}"
            ) from error
        except (KeyError, TypeError, ValueError) as error:
            last_error = error

    raise ValueError(f"Local LLM returned invalid JSON after 2 attempts: {last_error}")


def generate(prompt, response_format="text", model=None, provider=None):
    """Generate through Ollama or the configured API using one stable interface.

    ``provider='api'`` is an explicit per-call override. Otherwise LLM_PROVIDER
    selects the provider, and FALLBACK_TO_API controls local failure recovery.
    """
    selected_provider = provider or os.getenv("LLM_PROVIDER", "gemini").lower()
    selected_model = model or _default_model(response_format)

    if selected_provider == "gemini":
        return generate_gemini(prompt, response_format=response_format, model=model)
    if selected_provider == "api":
        return generate_api(prompt, response_format=response_format, model=model)
    if selected_provider != "local":
        raise ValueError("LLM_PROVIDER must be 'local', 'gemini', or 'api'")

    try:
        return _generate_local(prompt, response_format, selected_model)
    except LocalLLMUnavailableError:
        if os.getenv("FALLBACK_TO_API", "false").lower() == "true":
            LOGGER.warning("Ollama unavailable; falling back to the configured API LLM")
            return generate_api(prompt, response_format=response_format, model=model)
        raise


def check_local_llm():
    """Log Ollama reachability and required model availability at startup."""
    try:
        response = requests.get(f"{_ollama_host()}/api/tags", timeout=5)
        response.raise_for_status()
        models = {item.get("name") for item in response.json().get("models", [])}
        required = {JSON_MODEL, TEXT_MODEL}
        missing = sorted(required - models)
        if missing:
            for model in missing:
                LOGGER.error("Model %s not found - run `ollama pull %s`", model, model)
            return False
        LOGGER.info("Ollama reachable at %s; models pulled: %s", _ollama_host(), ", ".join(sorted(models)))
        return True
    except (requests.RequestException, KeyError, TypeError, ValueError) as error:
        LOGGER.warning("Ollama is not reachable at %s: %s", _ollama_host(), error)
        return False
