"""Centralized LLM factory.

Every agent calls get_llm() instead of building its own ChatOpenAI client.
This way we configure the model + API key in ONE place. Swap providers or
models by editing .env, no code changes needed.

We use langchain-openai (the OpenAI SDK wrapper) but point it at OpenRouter,
which exposes an OpenAI-compatible endpoint. OpenRouter lets us switch
between Claude, GPT, Gemini, Llama, etc. with just a model-name change.
"""
import os
from dotenv import load_dotenv          # reads .env file into os.environ
from langchain_openai import ChatOpenAI  # LangChain's OpenAI-compatible chat model

# Load .env once at import time so os.getenv works for the rest of the file.
load_dotenv()

# Pull settings from environment with sensible defaults.
# OPENROUTER_MODEL can be any model id from https://openrouter.ai/models
MODEL = os.getenv("OPENROUTER_MODEL", "anthropic/claude-sonnet-4.5")
BASE_URL = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
API_KEY = os.getenv("OPENROUTER_API_KEY", "")


def get_llm(max_tokens: int = 2048, structured_output_schema=None):
    """Build a Chat LLM bound to OpenRouter.

    Args:
        max_tokens: maximum response length. Bigger = pricier + slower.
        structured_output_schema: a Pydantic model class. When provided, the
            LLM is forced to return data matching that schema (instead of
            free-form text). This is the magic that makes our agents reliable.

    Returns:
        A LangChain Runnable. Call .invoke(prompt_string) on it.
    """
    if not API_KEY:
        raise RuntimeError(
            "OPENROUTER_API_KEY is not set. Copy .env.example to .env and fill it in."
        )

    llm = ChatOpenAI(
        model=MODEL,
        api_key=API_KEY,
        base_url=BASE_URL,
        max_tokens=max_tokens,
        # Headers OpenRouter uses to attribute usage on their dashboard.
        # Must be ASCII only — non-ASCII characters (em-dash etc.) will crash.
        default_headers={
            "HTTP-Referer": "https://github.com/C6-Hackathon-Group-4",
            "X-Title": "C6 Hackathon - DevOps Incident Suite",
        },
    )
    # If a schema was passed, wrap the LLM so its output is parsed into that
    # Pydantic model automatically. .invoke() now returns an instance of the
    # schema instead of a raw string.
    if structured_output_schema is not None:
        return llm.with_structured_output(structured_output_schema)
    return llm
