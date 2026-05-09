"""Remediation agent.

For EACH incident produced by the classifier, generate a Fix:
  - root cause rationale
  - ordered steps (plain English, no command-line)
  - risk level

NEW: for each incident we first retrieve the top-3 most relevant runbook
snippets from the knowledge base (via agents/rag.py) and inject them into
the prompt. This grounds the LLM in *our team's specific procedures* instead
of generic patterns -- the core RAG (Retrieval-Augmented Generation) move.

This node runs *sequentially* over incidents in the current implementation.
Easy upgrade for later: parallelize using LangGraph's Send API or asyncio.
"""
from .config import get_llm
from .models import Fix, Incident, State
from .rag import retrieve

# Fallback runbook -- used when RAG returns no matches (unusual log type).
GENERIC_RUNBOOK = """
Common patterns and how to fix them in plain language:

- App keeps crashing on startup: check the logs for the actual error message, verify all required settings/env variables are filled in, confirm the database is reachable.
- Out of memory / app killed: increase the memory allowed for the app, look for memory leaks, reduce the workload or split it across more instances.
- Slow responses / timeouts: find the slow query or API call, add an index or cache, increase the timeout if the work is genuinely long.
- Database connection errors: check connection pool size vs database limit, close idle connections, look for transactions that never finish.
- Disk full: delete old logs/backups/temporary files, set up automatic cleanup, increase disk size if needed.
- Login failures / brute force: block the offending IP, enable rate limiting, require captcha, lock the targeted account.
- Email/SMTP failing: verify SMTP credentials, check the email provider's status page, confirm the server can reach the SMTP host.
- Payment failures: check the payment provider's status, verify API keys, look for rate limiting, retry with backoff.
"""

PROMPT = """You are a helpful engineer explaining a fix to a teammate.

Given the incident below, propose a concrete fix.

Style rules for the steps:
- Use plain English. Avoid jargon and tool-specific commands.
- Each step should be a short sentence describing WHAT to do, not HOW (no kubectl/docker/SQL syntax).
- 3 to 6 steps total. Order them by what to do first.
- Anyone on a small dev team (frontend, backend, QA, PM) should be able to follow along.

PRIORITIZE the team's own runbooks below over generic advice when they apply.
If a runbook snippet covers this incident, follow its specific guidance and cite the
source filename in runbook_ref (e.g. "database_outage").

Return rationale (root cause in 1-2 sentences), ordered steps, risk level, and a runbook_ref slug if applicable.

=== TEAM RUNBOOKS (retrieved for this incident) ===
{retrieved}

=== GENERIC FALLBACK PATTERNS ===
{generic}

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
    """Combine the most relevant incident fields into a search query for RAG.

    We prioritize error_type + summary because those carry the keywords that
    match runbook content. Evidence often has noisy timestamps and IDs that
    confuse keyword search.
    """
    return f"{incident.error_type} {incident.summary} {incident.service}"


def remediate_one(incident: Incident) -> Fix:
    """Generate a Fix for a single Incident. Two LLM-touching steps:
       1. Retrieve relevant runbook snippets (no LLM, just keyword search).
       2. One LLM call to synthesize the fix using those snippets.
    """
    # --- RAG retrieval -------------------------------------------------
    snippets = retrieve(_build_query(incident), k=3)
    retrieved_text = (
        "\n\n---\n\n".join(snippets)
        if snippets
        else "(no specific runbook matched -- rely on the generic patterns below)"
    )

    # --- LLM call with retrieved context -------------------------------
    llm = get_llm(max_tokens=2048, structured_output_schema=Fix)
    return llm.invoke(PROMPT.format(
        retrieved=retrieved_text,
        generic=GENERIC_RUNBOOK,
        id=incident.id,
        service=incident.service,
        error_type=incident.error_type,
        severity=incident.severity,
        summary=incident.summary,
        evidence=incident.evidence[:2000],
    ))


def remediate(state: State) -> dict:
    """LangGraph node: turn list[Incident] into dict[id, Fix].

    For each incident we:
      1. Search the runbook KB with BM25 for the top-3 relevant snippets.
      2. Pass those snippets + a generic fallback to the LLM.
      3. The LLM produces a Fix grounded in the team's own procedures.
    """
    fixes = {inc.id: remediate_one(inc) for inc in state["incidents"]}
    return {"remediations": fixes}
