import json
import os

import requests


class APIUnavailableError(RuntimeError):
    """Raised when the configured remote LLM cannot serve a request."""


def generate(prompt, response_format="text", model=None):
    """Generate text through an OpenAI-compatible chat completions endpoint."""
    api_key = os.getenv("LLM_API_KEY") or os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise APIUnavailableError("API LLM is not configured: set LLM_API_KEY or OPENAI_API_KEY")

    endpoint = os.getenv("LLM_API_URL", "https://api.openai.com/v1/chat/completions").rstrip("/")
    payload = {
        "model": model or os.getenv("LLM_API_MODEL", "gpt-4o-mini"),
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.2,
    }
    if response_format == "json":
        payload["response_format"] = {"type": "json_object"}

    try:
        response = requests.post(
            endpoint,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json=payload,
            timeout=30,
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
    except (requests.RequestException, KeyError, IndexError, TypeError, ValueError) as error:
        raise APIUnavailableError(f"API LLM request failed: {error}") from error

    if response_format == "json":
        try:
            return json.loads(content)
        except (TypeError, json.JSONDecodeError) as error:
            raise APIUnavailableError("API LLM returned invalid JSON") from error
    return content
