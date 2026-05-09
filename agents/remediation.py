"""Remediation agent.

For EACH incident produced by the classifier, generate a Fix:
  - root cause rationale
  - ordered steps (plain English, no command-line)
  - risk level

NEW: for each incident we first retrieve the top-3 most relevant runbook
snippets from the knowledge base (via agents/rag.py) and inject them into
the prompt. This grounds the LLM in our team's specific procedures instead
of generic patterns -- the core RAG (Retrieval-Augmented Generation) move.

Beyond per-incident retrieval, this node also AGGREGATES every retrieval
across all incidents and writes a structured RAG payload back to graph state:
  - retrieved_runbooks (deduped list of snippets)
  - rag_context (concatenated snippet text)
  - rag_sources (unique filenames)
  - rag_confidence (high / medium / low / none)
The UI can read these directly.
"""
from .config import get_llm
from .models import Fix, Incident, RetrievedSnippet, State
from .rag import build_rag_payload

PROMPT = """You are a helpful engineer explaining a fix to a teammate.

Given the incident below, propose a concrete fix.

Style rules for the steps:
- Use plain English. Avoid jargon and tool-specific commands.
- Each step should be a short sentence describing WHAT to do, not HOW.
- 3 to 6 steps total. Order them by what to do first.
- Anyone on a small dev team (frontend, backend, QA, PM) should follow it.

PRIORITIZE the team's own runbooks below over generic advice when they apply.
If a runbook snippet covers this incident, follow its specific guidance and
cite the source filename in runbook_ref (e.g. "nginx_502_runbook").

Return rationale (root cause in 1-2 sentences), ordered steps, risk level,
and a runbook_ref slug if applicable.

=== TEAM RUNBOOKS (retrieved for this incident, confidence: {confidence}) ===
{rag_context}

=== INCIDENT ===
id: {id}
service: {service}
error_type: {error_type}
severity: {severity}
summary: {summary}
evidence:
{evidence}
"""


def _build_query(incident: Incident) -> str:
    """Build a search query from the incident's most signal-rich fields."""
    return f"{incident.error_type} {incident.summary} {incident.service}"


def remediate_one(incident: Incident) -> tuple[Fix, dict]:
    """Generate a Fix and return it along with the RAG payload used.

    Returns:
        (fix, rag_payload) where rag_payload is the structured dict from
        build_rag_payload(). Caller is responsible for aggregating payloads
        across incidents.
    """
    payload = build_rag_payload(_build_query(incident), k=3)

    llm = get_llm(max_tokens=2048, structured_output_schema=Fix)
    fix = llm.invoke(PROMPT.format(
        confidence=payload["rag_confidence"],
        rag_context=payload["rag_context"],
        id=incident.id,
        service=incident.service,
        error_type=incident.error_type,
        severity=incident.severity,
        summary=incident.summary,
        evidence=incident.evidence[:2000],
    ))
    return fix, payload


def _confidence_rank(label: str) -> int:
    return {"none": 0, "low": 1, "medium": 2, "high": 3}.get(label, 0)


def remediate(state: State) -> dict:
    """LangGraph node: produce remediations + aggregated RAG payload.

    Iterates every incident, retrieves runbooks, calls the LLM, and
    aggregates the per-incident RAG results into a single state-level
    payload (deduped sources, combined context, max confidence).
    """
    fixes: dict[str, Fix] = {}
    all_snippets: list[RetrievedSnippet] = []
    seen_keys: set[tuple[str, str]] = set()  # (source, matched_section)
    contexts: list[str] = []
    sources_in_order: list[str] = []
    seen_sources: set[str] = set()
    max_confidence = "none"

    for inc in state["incidents"]:
        fix, payload = remediate_one(inc)
        fixes[inc.id] = fix

        # Aggregate snippets, dedup by (source, matched_section).
        for snip in payload["retrieved_runbooks"]:
            key = (snip["source"], snip["matched_section"])
            if key not in seen_keys:
                seen_keys.add(key)
                all_snippets.append(snip)

        if payload["rag_context"] and payload["rag_context"] != "(no specific runbook matched)":
            contexts.append(f"# Context for {inc.id}\n{payload['rag_context']}")

        for src in payload["rag_sources"]:
            if src not in seen_sources:
                seen_sources.add(src)
                sources_in_order.append(src)

        if _confidence_rank(payload["rag_confidence"]) > _confidence_rank(max_confidence):
            max_confidence = payload["rag_confidence"]

    # Sort the aggregated snippets by score (highest first) for nicer display.
    all_snippets.sort(key=lambda s: s["score"], reverse=True)

    return {
        "remediations": fixes,
        "retrieved_runbooks": all_snippets,
        "rag_context": "\n\n===\n\n".join(contexts) if contexts else "(no specific runbook matched)",
        "rag_sources": sources_in_order,
        "rag_confidence": max_confidence,
    }
