# Project Status & Roadmap

A snapshot for the team: what works today, what doesn't, and what we could build next.

---

## What's working today

### Agents (5 + 1 final report node)
| Agent | Status | Notes |
|---|---|---|
| Classifier | ✅ Working | Reads raw logs, returns typed `Incident` list with severity scoring |
| Remediation | ✅ Working | Generates plain-English fix steps per incident |
| Cookbook synthesizer | ✅ Working | Consolidated checklist across all incidents |
| Slack notifier | ⚠️ Stub | Returns `"not-implemented"`. Needs Slack app + bot token |
| JIRA ticketer | ⚠️ Stub | Returns `[]`. Needs Atlassian API token |
| Final report builder | ✅ Working | Pure Python — assembles markdown from state |

### Plumbing
- ✅ LangGraph DAG wired and visualized in the UI as a PNG
- ✅ Pydantic structured output for every LLM call (no JSON parsing bugs)
- ✅ OpenRouter integration — swap models via `OPENROUTER_MODEL` env var
- ✅ Streamlit UI with file upload, log preview, tabbed results
- ✅ Session state preserves uploads across Streamlit reruns
- ✅ 4 sample logs in `Sample_logs/` covering web/auth/payments/disk scenarios
- ✅ Public GitHub repo with branching workflow documented

### What we can demo right now
1. Upload `payment_errors.log`
2. Pipeline detects 4-5 incidents in ~20-40 seconds
3. Per-incident remediation tabs with severity, root cause, ordered steps
4. Consolidated runbook checklist
5. Markdown report ready to paste into a postmortem doc

---

## Honest gaps

### "Agents collaborate" — currently weak
The flow is a **linear pipeline**, not real collaboration:
- Remediation runs once per incident, **blind to the others**. If incident A caused incident B, the fixes won't reference each other.
- No agent calls another agent. No critic loop, no debate, no refinement.
- No retry — if the cookbook is bad, no one rejects it.

What we have is "data flowing through specialized agents." Not the agentic-AI hype version of "collaboration."

### Notifier stubs
Slack and JIRA both return placeholders. Pipeline runs end-to-end but downstream tools see nothing.

### No memory / RAG
Every analysis starts from zero. We don't:
- Look up similar past incidents
- Reference internal runbooks or wiki pages
- Cross-reference CVE databases for security incidents
- Cache fixes for recurring problems

### Single log format assumption
The classifier prompt is tuned for our 4 sample logs. Real-world logs (JSON-structured, multiline stack traces, custom formats) may need prompt tweaks.

### No evals
No automated test suite. We eyeball whether the agent outputs look reasonable. A regression in the classifier prompt could go unnoticed.

---

## Future implementations — ranked by impact / effort

### Tier 1: high-impact, low-effort (each ~15-30 min)

**1. Cross-incident remediation context** ⭐ biggest credibility upgrade
Pass *all* incidents into each remediation call, not just the one being fixed. The agent can then say "this OOM probably caused the DB pool issue downstream — fix the OOM first." Now we can honestly say agents reason across incidents.

**2. Implement Slack notifier**
Real-time threaded posts during the demo are gold for judges. Use `slack-sdk`, post a parent message + one threaded reply per incident with severity emoji.

**3. Implement JIRA ticketer**
Filter to high/critical only. Use `atlassian-python-api`. Show the ticket appearing on a JIRA board mid-demo.

**4. Add a critic agent**
A 6th agent reviews the cookbook and either approves it or asks the cookbook synthesizer to redo with feedback. LangGraph supports loops via conditional edges. Demo gold: "watch agent A reject agent B's first attempt."

### Tier 2: medium-impact, medium-effort (each ~30-60 min)

**5. RAG over a runbook knowledge base** ⭐ unlocks real domain knowledge
Index a folder of markdown runbooks with a vector store (Chroma, FAISS, or LangChain's `InMemoryVectorStore`). For each incident, retrieve the top-3 relevant runbook snippets and pass them to the remediation agent. Suddenly the agent knows about *your team's* tools and procedures, not just generic patterns.

Possible knowledge base sources:
- Your team's existing wiki / Notion / Confluence
- A folder of `.md` files in this repo
- Past postmortems
- Public sources (CNCF runbooks, AWS Well-Architected docs)

**6. Severity-conditional routing**
LangGraph conditional edges → `critical` incidents go through a deeper analysis branch (extra LLM call, web search), `warn` skips it. Real orchestration, not just sequencing.

**7. Tool-using remediation agent**
Give it a `web_search` tool so it can look up the actual error message string. Now agents *act*, not just generate text.

**8. Parallel remediation**
Currently remediations run sequentially (5 incidents = 5 LLM calls back-to-back). Use `asyncio.gather` or LangGraph `Send` API → analyze 5 incidents in parallel → 4-5x speedup.

**9. Eval harness**
Build a small set of `(log_input, expected_incidents)` pairs. Run the classifier against them and assert key fields match. Run before every commit.

### Tier 3: high-effort but big payoff (each ~2-4 hours)

**10. Multi-source ingestion**
Beyond log files: connect to Loki / CloudWatch / Datadog APIs, pull recent errors directly. No upload step.

**11. Real-time monitoring mode**
Replace one-shot upload with a streaming connection. Agent watches logs, surfaces anomalies as they happen.

**12. Auto-remediation**
For low-risk fixes (restart a deployment, clear a cache), let the agent execute via tool calls. Human approval before each action.

**13. Multi-tenant / multi-environment**
Separate state per team / per environment. Per-team runbook KBs. Per-team Slack channels.

**14. Cost tracking dashboard**
Each LLM call cost shown in the UI. Per-run total. Per-day burn rate.

---

## Recommended hackathon priority

**For maximum demo impact in remaining time:**

1. **Tier 1 #1 (cross-incident context)** — 15 min, upgrades the "collaboration" claim
2. **Tier 1 #2 (Slack)** — 30 min, adds the live external-system-update wow moment
3. **Tier 1 #4 (critic agent)** — 30 min, gives us a real LangGraph cycle to point at on the DAG image

If there's time after that:

4. **Tier 2 #5 (RAG)** — 45 min, lets us claim "domain-aware reasoning" with a real knowledge base
5. **Tier 1 #3 (JIRA)** — 30 min, completes the integration story

Skip everything else for the demo. Document it as "future work" on the slide deck.

---

## What we should NOT claim on stage

- ❌ "Agents collaborate" — only true after Tier 1 #1 lands
- ❌ "Self-healing" — we don't auto-remediate
- ❌ "Production-ready" — no auth, no rate limiting, no audit log
- ❌ "Continuous monitoring" — we're one-shot upload-then-analyze

## What we CAN claim honestly today

- ✅ "Five specialized agents orchestrated as a LangGraph DAG"
- ✅ "Pydantic structured output ensures every agent handoff is validated"
- ✅ "Provider-agnostic via OpenRouter — swap Claude/GPT/Gemini with one env var"
- ✅ "Plain-English remediations any team member can follow, not just SREs"
- ✅ "Open source, ready to extend with the team's own runbooks and integrations"
