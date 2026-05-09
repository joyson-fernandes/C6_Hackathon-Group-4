"""Streamlit UI for the Multi-Agent DevOps Incident Analysis Suite."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import streamlit as st
from agents.graph import build_graph
from agents.rag import kb_size

# --- Page setup ---------------------------------------------------------
st.set_page_config(page_title="DevOps Incident Analysis", page_icon=":fire:", layout="wide")
st.title("Multi-Agent DevOps Incident Analysis Suite")
st.caption(
    f"Upload ops logs -> 5 agents analyze, remediate, notify, and ticket. "
    f"RAG knowledge base: {kb_size()} runbook chunks indexed."
)

# --- Session state initialization --------------------------------------
if "logs_text" not in st.session_state:
    st.session_state.logs_text = ""

# --- Sidebar -----------------------------------------------------------
with st.sidebar:
    st.header("Controls")
    show_graph = st.checkbox("Show LangGraph DAG", value=True)
    if st.button("Clear logs", use_container_width=True):
        st.session_state.logs_text = ""

# --- Log input ---------------------------------------------------------
uploaded = st.file_uploader("Upload a log file", type=["log", "txt", "json"])
if uploaded is not None:
    st.session_state.logs_text = uploaded.read().decode("utf-8", errors="ignore")

logs_text = st.session_state.logs_text

if logs_text:
    st.text_area("Input logs", logs_text, height=200)
    st.caption(f"{len(logs_text)} chars loaded")

# --- Optional DAG diagram ---------------------------------------------
if show_graph:
    with st.expander("LangGraph topology", expanded=False):
        graph = build_graph()
        try:
            png_bytes = graph.get_graph().draw_mermaid_png()
            st.image(png_bytes, caption="Agent DAG", width=200)
        except Exception as e:
            st.warning(f"PNG render failed ({e}); falling back to mermaid source.")
            st.code(graph.get_graph().draw_mermaid(), language="text")

# --- The main action: run the graph -----------------------------------
if st.button("Analyze", type="primary", disabled=not logs_text):
    graph = build_graph()
    with st.status("Running agents...", expanded=True) as status:
        st.write(
            "classify -> severity_router -> (deep_analysis | rag | remediate-with-RAG | summary) "
            "-> validator -> (retry | cookbook | escalate) -> human_approval -> slack/jira -> report"
        )
        result = graph.invoke({"raw_logs": logs_text})
        status.update(label="Done", state="complete")

    # --- Top-level workflow summary (severity routing + validator) -------
    severity = result.get("severity", "n/a")
    sev_badge_color = {
        "critical": ":red", "high": ":orange", "medium": ":violet",
        "low": ":blue", "info": ":gray",
    }.get(severity, ":gray")

    st.subheader("Workflow Summary")
    col_a, col_b, col_c = st.columns(3)
    with col_a:
        st.markdown(f"**Severity** {sev_badge_color}[`{severity}`]")
        st.caption(f"Incident type: `{result.get('incident_type', 'n/a')}`")
    with col_b:
        st.markdown(f"**Validator** `{result.get('validator_status', 'n/a')}`")
        st.caption(f"Quality score: {result.get('quality_score', 'n/a')}/10")
    with col_c:
        st.markdown(f"**Retries** `{result.get('retry_count', 0)}/2`")
        st.caption(f"Human approval: {result.get('human_approval_status', 'n/a')}")

    path = result.get("execution_path") or []
    if path:
        st.markdown("**Execution path:** " + " -> ".join(f"`{n}`" for n in path))

    st.divider()

    tab_inc, tab_route, tab_val, tab_rem, tab_rag, tab_cb, tab_notif = st.tabs(
        ["Incidents", "Routing", "Validator", "Remediations", "RAG", "Cookbook", "Notifications"]
    )

    # Tab: Incidents
    with tab_inc:
        for inc in result.get("incidents", []):
            sev_color = {
                "critical": ":red", "high": ":orange", "warn": ":yellow",
                "medium": ":violet", "low": ":blue", "info": ":gray",
            }.get(inc.severity, ":gray")
            st.markdown(f"**{inc.id}** {sev_color}[`{inc.severity}`] - `{inc.service}` - {inc.error_type}")
            st.caption(inc.summary)
            with st.expander("evidence"):
                st.code(inc.evidence)

    # Tab: Routing
    with tab_route:
        st.markdown("### Severity Routing")
        st.markdown(f"- **Detected severity:** `{result.get('severity', 'n/a')}`")
        st.markdown(f"- **Incident type:** `{result.get('incident_type', 'n/a')}`")
        st.markdown(f"- **Routing path:** `{result.get('routing_path', 'n/a')}`")
        st.markdown(f"- **Routing reason:** {result.get('routing_reason', 'n/a')}")
        st.markdown("#### Routing flags")
        for k, v in {
            "Requires deep analysis": result.get("requires_deep_analysis", False),
            "Requires RAG": result.get("requires_rag", False),
            "Requires human approval": result.get("requires_human_approval", False),
            "Requires ticket": result.get("requires_ticket", False),
            "Requires notification": result.get("requires_notification", False),
        }.items():
            st.markdown(f"- {k}: {'yes' if v else 'no'}")

    # Tab: Validator
    with tab_val:
        status_v = result.get("validator_status", "n/a")
        st.markdown(f"### Validator status: `{status_v}`")
        st.markdown(f"- **Quality score:** {result.get('quality_score', 'n/a')}/10")
        st.markdown(f"- **Retry count:** {result.get('retry_count', 0)} (max 2)")
        st.markdown(f"- **Requires human approval:** {result.get('requires_human_approval', False)}")
        st.markdown(f"- **Escalation required:** {result.get('escalation_required', False)}")
        st.markdown(f"- **Reason:** {result.get('validation_reason', 'n/a')}")
        if rev := result.get("revision_instruction"):
            st.markdown(f"- **Revision instruction:** {rev}")
        issues = result.get("issues_found") or []
        if issues:
            st.markdown("#### Issues found")
            for it in issues:
                st.markdown(f"- {it}")
        else:
            st.success("No validation issues found.")

    # Tab: Remediations (with RAG compliance badges)
    with tab_rem:
        compliance_by_id = {c["incident_id"]: c for c in result.get("rag_compliance", [])}
        status_emoji = {"ok": "OK", "warn": "WARN", "fail": "FAIL"}
        for fid, fix in (result.get("remediations") or {}).items():
            comp = compliance_by_id.get(fid)
            badge = (
                f"[{status_emoji.get(comp['status'], '')}] RAG: {comp['status']} ({comp['requirement']})"
                if comp else ""
            )
            st.subheader(f"{fid} - risk: {fix.risk}  {badge}")
            if fix.runbook_ref:
                st.caption(f"Cited runbook: `{fix.runbook_ref}`")
            if comp and comp["status"] != "ok":
                if comp["status"] == "fail":
                    st.error(comp["reason"])
                else:
                    st.warning(comp["reason"])
            st.write(fix.rationale)
            for n, s in enumerate(fix.steps, 1):
                st.write(f"{n}. {s}")

    # Tab: RAG (structured payload)
    with tab_rag:
        confidence = result.get("rag_confidence", "none")
        sources = result.get("rag_sources", [])
        snippets = result.get("retrieved_runbooks", [])

        cols = st.columns(3)
        cols[0].metric("Confidence", confidence)
        cols[1].metric("Unique sources", len(sources))
        cols[2].metric("Snippets retrieved", len(snippets))

        if sources:
            st.markdown("**Sources cited:**")
            for src in sources:
                st.markdown(f"- `{src}`")

        st.divider()
        st.markdown("### RAG policy compliance (severity-based)")
        compliance = result.get("rag_compliance", [])
        if not compliance:
            st.info("No compliance data")
        else:
            n_fail = sum(1 for c in compliance if c["status"] == "fail")
            n_warn = sum(1 for c in compliance if c["status"] == "warn")
            n_ok = sum(1 for c in compliance if c["status"] == "ok")
            cc = st.columns(3)
            cc[0].metric("Pass", n_ok)
            cc[1].metric("Warn", n_warn)
            cc[2].metric("Fail", n_fail)

            for c in compliance:
                emoji = {"ok": "OK", "warn": "WARN", "fail": "FAIL"}[c["status"]]
                st.markdown(
                    f"[{emoji}] **{c['incident_id']}** "
                    f"`{c['severity']}` -> requirement: `{c['requirement']}` -> "
                    f"status: `{c['status']}`"
                )
                st.caption(c["reason"])

        st.divider()
        st.markdown("### Retrieved snippets (sorted by score)")
        for snip in snippets:
            with st.expander(
                f"{snip['source']} -> {snip['matched_section']}  (score: {snip['score']})"
            ):
                st.markdown(snip["content"])

        st.divider()
        st.markdown("### Raw RAG payload (state object)")
        st.json({
            "retrieved_runbooks": snippets,
            "rag_sources": sources,
            "rag_confidence": confidence,
            "rag_compliance": result.get("rag_compliance", []),
            "rag_context_preview": (result.get("rag_context", "") or "")[:1000] + (
                "..." if len(result.get("rag_context", "") or "") > 1000 else ""
            ),
        })

    # Tab: Cookbook
    with tab_cb:
        cb = result.get("cookbook")
        if cb:
            st.subheader(cb.title)
            for it in cb.items:
                st.checkbox(it, key=f"cb-{it}")

    # Tab: Notifications
    with tab_notif:
        st.write(f"Slack thread: `{result.get('slack_thread_ts')}`")
        st.write(f"JIRA tickets: {result.get('jira_keys', [])}")
        st.caption("Slack/JIRA stay mocked unless real credentials are configured.")

    # Final markdown report.
    st.divider()
    st.markdown(result.get("report_md", ""))
