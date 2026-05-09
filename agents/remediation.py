"""Remediation agent.

For EACH incident produced by the classifier, generate a Fix:
  - root cause rationale
  - ordered steps (plain English, no command-line)
  - risk level

This node runs *sequentially* over incidents in the current implementation.
Easy upgrade for later: parallelize using LangGraph's Send API or asyncio.
"""
from .config import get_llm
from .models import Fix, Incident, State

# Reference patterns the LLM can match against. Phrased in plain English so
# the generated fixes stay readable for non-DevOps team members.
RUNBOOK = """
Common patterns and how to fix them in plain language:

- App keeps crashing on startup: check the logs for the actual error message, verify all required settings/env variables are filled in, confirm the database is reachable.
- Out of memory / app killed: increase the memory allowed for the app, look for memory leaks, reduce the workload or split it across more instances.
- Slow responses / timeouts: find the slow query or API call, add an index or cache, increase the timeout if the work is genuinely long.
- Database connection errors: check connection pool size vs database limit, close idle connections, look for transactions that never finish.
- Disk full: delete old logs/backups/temporary files, set up automatic cleanup, increase disk size if needed.
- Certificate expired or about to expire: renew the certificate, fix the auto-renewal job, update DNS records if needed.
- Login failures / brute force: block the offending IP, enable rate limiting, require captcha, lock the targeted account.
- Email/SMTP failing: verify SMTP credentials, check the email provider's status page, confirm the server can reach the SMTP host.
- Payment failures: check the payment provider's status, verify API keys, look for rate limiting, retry with backoff.
- Webhook delivery failing: check the receiving server is up, verify the webhook URL is correct, enable retries with exponential backoff.
- Rate limited by external API: slow down the request rate, batch requests, request a higher quota, add caching.
"""

# Prompt template — every {placeholder} is replaced with values from the
# incident before sending to the LLM.
PROMPT = """You are a helpful engineer explaining a fix to a teammate.

Given the incident below, propose a concrete fix.

Style rules for the steps:
- Use plain English. Avoid jargon and tool-specific commands.
- Each step should be a short sentence describing WHAT to do, not HOW (no kubectl/docker/SQL syntax).
- 3 to 6 steps total. Order them by what to do first.
- Anyone on a small dev team (frontend, backend, QA, PM) should be able to follow along.

Use the runbook patterns when relevant; otherwise reason from first principles.
Return rationale (root cause in 1-2 sentences), ordered steps, risk level, and a runbook_ref slug if applicable.

{runbook}

INCIDENT:
id: {id}
service: {service}
error_type: {error_type}
severity: {severity}
summary: {summary}
evidence:
{evidence}
"""


def remediate_one(incident: Incident) -> Fix:
    """Generate a Fix for a single Incident. One LLM call."""
    # Bind the schema so the LLM returns a valid Fix object directly.
    llm = get_llm(max_tokens=2048, structured_output_schema=Fix)

    # Truncate evidence to 2000 chars to keep prompts compact.
    return llm.invoke(PROMPT.format(
        runbook=RUNBOOK,
        id=incident.id,
        service=incident.service,
        error_type=incident.error_type,
        severity=incident.severity,
        summary=incident.summary,
        evidence=incident.evidence[:2000],
    ))


def remediate(state: State) -> dict:
    """LangGraph node: turn list[Incident] into dict[id, Fix].

    Loops over every incident. For 5 incidents this is 5 LLM calls (~10 sec total).
    For demo data this is fine. To parallelize later, swap to asyncio.gather
    over remediate_one.
    """
    fixes = {inc.id: remediate_one(inc) for inc in state["incidents"]}
    return {"remediations": fixes}
