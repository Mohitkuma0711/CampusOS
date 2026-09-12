# CareerOS LLM architecture

## Stable interface

All AI tasks call the same Flask-side function:

```python
from llm_client import generate

result = generate(prompt, response_format="json", model=None)
```

Task code does not know whether the response came from Ollama or a remote provider. `response_format="json"` selects `qwen2.5:7b` by default and validates/parses the response; open-ended text selects `llama3.1:8b`. An explicit `provider="api"` override is available for reasoning-heavy tasks such as mock interview feedback.

Resume feedback uses `provider="gemini"` explicitly because the resume builder is configured to use the Gemini API instead of a local model. Set `GEMINI_API_KEY` and optionally `GEMINI_MODEL` in the ML service environment. The key is server-side only and must never be placed in the React `VITE_*` environment.

## Routing

1. `LLM_PROVIDER=local` routes to Ollama at `OLLAMA_HOST`.
2. `LLM_PROVIDER=gemini` routes generic tasks to Gemini when selected.
3. `LLM_PROVIDER=api` routes to the OpenAI-compatible API adapter.
4. Resume feedback overrides the global provider to Gemini explicitly.
5. With local routing, `LocalLLMUnavailableError` can fall back to the API only when `FALLBACK_TO_API=true`.
6. JSON responses receive validation before returning to a route.
7. Every request has a bounded timeout; no request is allowed to hold a core API worker indefinitely.

## Task ownership

- Resume feedback: structured JSON through the default local model.
- ATS reports: structured JSON through the default local model.
- Test generation: structured JSON through the default local model.
- Mock interview feedback: API provider by default, but still called through the same abstraction.

## Failure contract

The ML service returns typed failures and the Node service translates them to user-visible states such as `feedback_delayed` or `ai_unavailable`. Resume persistence and dashboard reads do not depend on an LLM response. Prompts and task response schemas are versioned alongside the task route so model changes can be evaluated before rollout.

## Local operations

```bash
ollama pull qwen2.5:7b
ollama pull llama3.1:8b
cd Backend/ml-service
.venv/bin/python app.py
```

Startup checks call `/api/tags` and log missing model commands without exposing API credentials.
