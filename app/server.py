"""FastAPI HTTP server exposing the LangGraph pipeline to the React frontend.

Run:
    uvicorn app.server:app --reload --port 8000
"""
import os
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/analyze")
def analyze(req: AnalyzeRequest) -> dict[str, Any]:
    if not req.logs.strip():
        raise HTTPException(status_code=400, detail="logs is empty")
    try:
        state = graph.invoke({"raw_logs": req.logs})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"pipeline failure: {e}")

    incidents = [i.model_dump() for i in state.get("incidents", [])]
    remediations = {k: v.model_dump() for k, v in state.get("remediations", {}).items()}
    cookbook = state["cookbook"].model_dump() if state.get("cookbook") else None

    return {
        "incidents": incidents,
        "remediations": remediations,
        "cookbook": cookbook,
        "report_md": state.get("report_md", ""),
        "rag_sources": state.get("rag_sources", []),
        "rag_confidence": state.get("rag_confidence", "none"),
        "rag_compliance": state.get("rag_compliance", []),
        "slack_thread_ts": state.get("slack_thread_ts"),
        "jira_keys": state.get("jira_keys", []),
    }
