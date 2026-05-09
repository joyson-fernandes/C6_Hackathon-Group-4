"""FastAPI HTTP server exposing the LangGraph pipeline + serving the React UI.

Run locally:
    uvicorn app.server:app --reload --port 8000

In production (containerized) the same image serves /api/* and the built
React static bundle from /app/web/dist.

Per-request OpenRouter override:
    The /api/analyze endpoint accepts an optional `X-OpenRouter-API-Key`
    header. When set, the env var is swapped for the duration of that
    request so each user can BYO-key from the Settings UI without losing
    the Vault-backed default.
"""
import os
import threading
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from agents.graph import build_graph

load_dotenv()

app = FastAPI(title="DevOps Incident Analysis API")

origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

graph = build_graph()


class AnalyzeRequest(BaseModel):
    logs: str


# Serialize per-request env-var swaps so concurrent /analyze calls with
# different API keys don't clobber each other. The pipeline is LLM-bound so
# real concurrency is low — this is a pragmatic mutex, not a hot path.
_env_lock = threading.Lock()


@contextmanager
def _env_override(updates: dict[str, str | None]) -> Iterator[None]:
    """Temporarily set env vars for the duration of a block, then restore."""
    saved: dict[str, str | None] = {}
    with _env_lock:
        try:
            for key, value in updates.items():
                saved[key] = os.environ.get(key)
                if value is None:
                    continue
                os.environ[key] = value
            yield
        finally:
            for key, prior in saved.items():
                if prior is None:
                    os.environ.pop(key, None)
                else:
                    os.environ[key] = prior


@app.get("/healthz", include_in_schema=False)
def healthz() -> dict[str, str]:
    """Kubernetes liveness/readiness probe target."""
    return {"status": "ok"}


@app.get("/api/health")
def health() -> dict[str, bool]:
    """Includes whether a server-side OpenRouter key is configured."""
    return {
        "status": True,
        "server_key_configured": bool(os.getenv("OPENROUTER_API_KEY")),
    }


@app.post("/api/analyze")
def analyze(
    req: AnalyzeRequest,
    x_openrouter_api_key: str | None = Header(default=None, alias="X-OpenRouter-API-Key"),
    x_openrouter_model: str | None = Header(default=None, alias="X-OpenRouter-Model"),
) -> dict[str, Any]:
    if not req.logs.strip():
        raise HTTPException(status_code=400, detail="logs is empty")

    overrides: dict[str, str | None] = {}
    if x_openrouter_api_key:
        overrides["OPENROUTER_API_KEY"] = x_openrouter_api_key
    if x_openrouter_model:
        overrides["OPENROUTER_MODEL"] = x_openrouter_model

    try:
        if overrides:
            with _env_override(overrides):
                state = graph.invoke({"raw_logs": req.logs})
        else:
            state = graph.invoke({"raw_logs": req.logs})
    except RuntimeError as e:
        # agents/config.py raises this when no API key is available.
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"pipeline failure: {e}")

    incidents = [i.model_dump() for i in state.get("incidents", [])]
    remediations = {k: v.model_dump() for k, v in state.get("remediations", {}).items()}
    cookbook = state["cookbook"].model_dump() if state.get("cookbook") else None

    return {
        # Core analysis output
        "incidents": incidents,
        "remediations": remediations,
        "cookbook": cookbook,
        "report_md": state.get("report_md", ""),

        # RAG payload
        "rag_sources": state.get("rag_sources", []),
        "rag_confidence": state.get("rag_confidence", "none"),
        "rag_compliance": state.get("rag_compliance", []),
        "rag_snippet_count": state.get("rag_snippet_count", 0),

        # Severity router output (run-level)
        "severity": state.get("severity"),
        "incident_type": state.get("incident_type"),
        "routing_path": state.get("routing_path"),
        "routing_reason": state.get("routing_reason"),
        "flags": {
            "requires_deep_analysis": state.get("requires_deep_analysis", False),
            "requires_rag": state.get("requires_rag", False),
            "requires_human_approval": state.get("requires_human_approval", False),
            "requires_ticket": state.get("requires_ticket", False),
            "requires_notification": state.get("requires_notification", False),
        },

        # Validator output
        "validator_status": state.get("validator_status"),
        "quality_score": state.get("quality_score"),
        "issues_found": state.get("issues_found", []),
        "revision_instruction": state.get("revision_instruction", ""),
        "escalation_required": state.get("escalation_required", False),
        "validation_reason": state.get("validation_reason"),
        "retry_count": state.get("retry_count", 0),

        # Human approval + execution trace
        "human_approval_status": state.get("human_approval_status"),
        "execution_path": state.get("execution_path", []),

        # Notifier stubs
        "slack_thread_ts": state.get("slack_thread_ts"),
        "jira_keys": state.get("jira_keys", []),
    }


# --- Serve the built React frontend (production) ----------------------------
WEB_DIST = Path(__file__).parent.parent / "web" / "dist"

if WEB_DIST.is_dir():
    assets_dir = WEB_DIST / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    async def spa(path: str) -> FileResponse:
        if path.startswith("api/") or path == "healthz":
            raise HTTPException(status_code=404)
        candidate = WEB_DIST / path
        if path and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(WEB_DIST / "index.html")
