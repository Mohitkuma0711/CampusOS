import json
import os

import requests


class GeminiUnavailableError(RuntimeError):
    """Raised when Gemini cannot serve a request."""


def _parse_json(content):
    try:
        return json.loads(content)
    except (TypeError, json.JSONDecodeError) as error:
        raise ValueError("Gemini returned invalid JSON") from error


def generate(prompt, response_format="text", model=None):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key.startswith("your-"):
        raise GeminiUnavailableError("Gemini is not configured: set GEMINI_API_KEY")

    selected_model = model or os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
    endpoint = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{selected_model}:generateContent"
    )
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2},
    }
    if response_format == "json":
        payload["generationConfig"]["responseMimeType"] = "application/json"

    try:
        response = requests.post(
            endpoint,
            params={"key": api_key},
            json=payload,
            timeout=30,
        )
        response.raise_for_status()
        content = response.json()["candidates"][0]["content"]["parts"][0]["text"]
    except requests.RequestException as error:
        raise GeminiUnavailableError(f"Gemini request failed: {error}") from error
    except (KeyError, IndexError, TypeError, ValueError) as error:
        raise GeminiUnavailableError(f"Gemini returned an unusable response: {error}") from error

    if response_format == "json":
        try:
            return _parse_json(content)
        except ValueError as error:
            raise GeminiUnavailableError("Gemini returned invalid JSON") from error
    return content
