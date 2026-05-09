"""Optional LangSmith tracing helpers.

The main LangChain/LangGraph stack picks up LangSmith tracing from
environment variables. This module keeps direct OpenAI wrapping optional so
the app can start without a LangSmith key or a server-side OpenRouter key.
"""
from __future__ import annotations

import os


def configure_langsmith() -> bool:
    """Return True when LangSmith tracing is explicitly enabled."""
    tracing = os.getenv("LANGSMITH_TRACING", "false").strip().lower()
    if tracing not in ("1", "true", "yes", "on"):
        return False

    os.environ.setdefault("LANGSMITH_ENDPOINT", "https://api.smith.langchain.com")
    os.environ.setdefault("LANGSMITH_PROJECT", "C6-Hackathon-Group-4")
    return bool(os.getenv("LANGSMITH_API_KEY"))


def get_traced_openai_client():
    """Build a LangSmith-wrapped OpenAI client when all credentials exist.

    Returns None when tracing or OpenRouter credentials are absent. This keeps
    local tests, API startup, and demo-mode UI usage from depending on
    LangSmith.
    """
    if not configure_langsmith():
        return None

    base_url = os.getenv("OPENROUTER_BASE_URL")
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not base_url or not api_key:
        return None

    from openai import OpenAI
    from langsmith import wrappers

    return wrappers.wrap_openai(OpenAI(base_url=base_url, api_key=api_key))
