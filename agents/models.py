"""Shared Pydantic models used by every agent.

Pydantic = Python library that gives you typed data classes with automatic
validation. We use it here for two reasons:
  1. Type safety — every agent knows exactly what shape of data it gets/returns.
  2. Structured LLM output — we hand these classes to the LLM and it fills them
     in as JSON. The LLM is *forced* to produce data that matches the schema,
     which is much more reliable than parsing free-form text.
"""
from typing import Literal, TypedDict
from pydantic import BaseModel, Field

# Severity is a fixed set of strings — Literal restricts the allowed values.
# The LLM will only ever pick one of these four.
Severity = Literal["info", "warn", "high", "critical"]


class Incident(BaseModel):
    """One distinct problem detected in the logs."""

    # Field(description=...) becomes part of the JSON schema sent to the LLM.
    # Good descriptions = better LLM output.
    id: str = Field(description="stable short id, e.g. INC-001")
    service: str = Field(description="affected service / namespace / component")
    error_type: str = Field(description="canonical category, e.g. App Crash, Disk Full")
    severity: Severity
    summary: str = Field(description="one-line human summary")
    evidence: str = Field(description="raw log lines or stack trace excerpt")
    first_seen: str | None = None  # optional; the LLM may leave this blank


class Fix(BaseModel):
    """A proposed remediation for a single incident."""
    incident_id: str
    rationale: str = Field(description="why this fix addresses the root cause")
    steps: list[str] = Field(description="ordered remediation steps")
    risk: Literal["low", "medium", "high"]
    runbook_ref: str | None = None  # slug of the matching runbook pattern, if any


class Checklist(BaseModel):
    """A consolidated runbook checklist covering all incidents."""
    title: str
    items: list[str]


class IncidentList(BaseModel):
    """Wrapper so the LLM returns a single object containing the list.

    Some LLM providers handle a top-level list poorly via structured output,
    so we always wrap lists in an object.
    """
    incidents: list[Incident]


class State(TypedDict, total=False):
    """The shared state object passed between every node in the LangGraph DAG.

    LangGraph merges partial dicts returned from each node into this state.
    `total=False` means every key is optional — nodes only fill in what they
    produce.
    """
    raw_logs: str                       # set by the UI before invoke()
    incidents: list[Incident]           # set by classifier
    remediations: dict[str, Fix]        # set by remediation node, keyed by incident id
    cookbook: Checklist                 # set by cookbook node
    slack_thread_ts: str | None         # set by slack node (Slack thread timestamp)
    jira_keys: list[str]                # set by jira node (e.g. ["OPS-42"])
    report_md: str                      # set by final report node
