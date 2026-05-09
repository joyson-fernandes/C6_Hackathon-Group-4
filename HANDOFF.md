# Handoff to next Claude Code session

You are taking over a hackathon project mid-build. Read this top-to-bottom
before doing anything. STATUS.md has the full roadmap; this file gives you
just what you need to be productive immediately.

## What this is

**C6 Hackathon Group 4 — Multi-Agent DevOps Incident Analysis Suite**

User uploads ops logs → 5 LangGraph agents analyze → typed incidents,
RAG-grounded remediations, consolidated runbook checklist, Slack/JIRA
(stubbed), final markdown report. Streamlit UI.

GitHub: https://github.com/joyson-fernandes/C6_Hackathon-Group-4 (public)
Local: this directory.

## Stack (already chosen, don't second-guess)

- **LangGraph** for agent DAG orchestration
- **langchain-openai** pointed at **OpenRouter** (provider-agnostic via env var)
- **Pydantic v2** for typed state + structured LLM output
- **Streamlit** UI
- **rank-bm25** for RAG over `knowledge_base/` markdown files
- Default model: `anthropic/claude-sonnet-4.5` via OpenRouter

User does NOT want:
- Direct Anthropic SDK (using OpenRouter for flexibility)
- Embedding-based RAG yet (BM25 is fine for current KB size; upgrade path is documented in `agents/rag.py`)
- A Makefile (team is junior; plain `pip` + `streamlit` commands in README)
- K8s-specific jargon in agent output (team is mixed-discipline; outputs must be plain English)

## Repo layout

```
C6_Hackathon-Group-4/
├── HANDOFF.md           # this file
├── STATUS.md            # current state, gaps, prioritized roadmap (READ THIS)
├── README.md            # public-facing setup guide
├── requirements.txt
├── .env.example         # OPENROUTER_API_KEY at minimum
├── .gitignore
│
├── agents/
│   ├── __init__.py
│   ├── config.py        # get_llm() factory; loads .env, points at OpenRouter
│   ├── models.py        # Pydantic models + State + RagCompliance + SEVERITY_RAG_POLICY
│   ├── classifier.py    # logs -> list[Incident] (LLM, structured output)
│   ├── remediation.py   # incident -> Fix; uses RAG + severity policy + compliance check
│   ├── rag.py           # BM25 over knowledge_base/; build_rag_payload() returns the structured RAG dict
│   ├── cookbook.py      # all incidents -> consolidated Checklist (LLM)
│   ├── notifier.py      # Slack + JIRA STUBS - users will implement
│   └── graph.py         # StateGraph wiring + final report builder
│
├── app/
│   └── main.py          # Streamlit UI with tabs: Incidents, Remediations, RAG, Cookbook, Notifications
│
├── knowledge_base/      # markdown KB indexed by RAG at startup
│   ├── nginx_502_runbook.md
│   ├── database_connection_pool_runbook.md
│   ├── disk_space_runbook.md
│   ├── memory_leak_runbook.md
│   ├── kubernetes_pod_crashloop_runbook.md
│   └── generic_incident_response.md
│
└── Sample_logs/         # demo log fixtures
    ├── website_slow.log
    ├── login_failures.log
    ├── payment_errors.log
    └── disk_full.log
```

## What's working end-to-end

1. Upload a log file → classifier extracts incidents
2. For each incident: BM25 retrieves top-3 KB snippets → LLM generates a Fix → severity policy compliance is computed
3. Cookbook agent consolidates all fixes into one checklist
4. Stubs for Slack + JIRA return placeholders
5. Final markdown report assembled and displayed

Graph state exposes (read this if you touch agents):
```python
class State(TypedDict, total=False):
    raw_logs: str
    incidents: list[Incident]
    remediations: dict[str, Fix]
    cookbook: Checklist
    slack_thread_ts: str | None
    jira_keys: list[str]
    report_md: str
    # RAG payload populated by remediation node:
    retrieved_runbooks: list[RetrievedSnippet]
    rag_context: str
    rag_sources: list[str]
    rag_confidence: "high" | "medium" | "low" | "none"
    rag_compliance: list[RagCompliance]
```

## What's NOT working / next priorities

See **STATUS.md** for the full ranked list. Top priorities:

1. **Cross-incident remediation context** (Tier 1 #1) — biggest credibility upgrade. Currently each incident's Fix is generated blind to the others. Pass the full incidents list into each `remediate_one()` call so the agent can cite cascading-failure relationships.
2. **Implement Slack notifier** (Tier 1 #2) — `agents/notifier.py::notify_slack` is a stub. Real implementation needs slack-sdk, a Bot User OAuth Token, and a channel.
3. **Implement JIRA ticketer** (Tier 1 #3) — `agents/notifier.py::file_jira` is a stub. Filter to high/critical only.
4. **Critic agent loop** (Tier 1 #4) — add a 6th agent that reviews the cookbook and rejects/approves; LangGraph conditional edges make a real cycle.

Any of these is a 15-30 min job. Pick based on what the team voted for.

## Critical local-vs-remote git divergence — READ THIS BEFORE COMMITTING

The previous session pushed to GitHub via the GitHub MCP API rather than `git push`. This means:
- Local commits and remote commits have **different SHAs**
- The two histories aren't related
- A regular `git pull` will fail

To realign before doing more local work, run ONCE:
```bash
git fetch origin
git reset --hard origin/main   # destructive: discards local commit graph, keeps the same final files
```

After that, normal `git push` will work.

There's also a leftover `runbooks/` folder on GitHub (replaced by `knowledge_base/`).
The reset above will get rid of it locally; push will remove it from GitHub.

## How to run

```bash
source .venv/bin/activate
streamlit run app/main.py
```

If `.venv` doesn't exist:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # then paste OPENROUTER_API_KEY
```

Restart Streamlit after editing files in `agents/` — the auto-reload misses imported-module changes.

## User preferences (from previous sessions)

- **Concise responses, no trailing summaries.** User reads diffs.
- **Don't ask for confirmation on safe operations.** Just do it.
- **Plain English in agent output.** No K8s jargon, no command-line syntax in remediation steps. The team is mixed-discipline.
- **Don't add comments unless they explain WHY.** Don't narrate WHAT the code does — names already do that.
- **Headers in HTTP requests must be ASCII-only.** OpenRouter chokes on em-dashes (this caused a UnicodeEncodeError earlier — already fixed in `agents/config.py`).
- **Streamlit `session_state`** is required to persist uploads across reruns. The Analyze button used to lose log content because of this; already fixed.

## Quick smoke test before any change

```bash
python -c "
from agents.graph import build_graph
g = build_graph()
print('graph builds:', g is not None)
from agents.rag import kb_size, build_rag_payload
print('kb chunks:', kb_size())
p = build_rag_payload('Out of memory OOMKilled', k=2)
print('rag confidence:', p['rag_confidence'])
print('top source:', p['rag_sources'][0] if p['rag_sources'] else 'none')
"
```

Should print:
```
graph builds: True
kb chunks: 36
rag confidence: high
top source: memory_leak_runbook.md
```

## Suggested first move

1. Read `STATUS.md` to see the prioritized roadmap.
2. Run the git realignment commands above.
3. Ask the user which Tier 1 item to tackle first (cross-incident context is the highest-impact / lowest-effort).
4. Implement, test against `Sample_logs/payment_errors.log` (the headline demo), commit, push.

Good luck.
