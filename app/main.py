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
        st.write("classifier -> remediation (RAG-grounded) -> cookbook -> slack/jira -> report")
        result = graph.invoke({"raw_logs": logs_text})
        status.update(label="Done", state="complete")

    tab_inc, tab_rem, tab_rag, tab_cb, tab_notif = st.tabs(
        ["Incidents", "Remediations", "RAG", "Cookbook", "Notifications"]
    )

    # Tab: Incidents
    with tab_inc:
        for inc in result["incidents"]:
            sev_color = {"critical": ":red", "high": ":orange", "warn": ":yellow", "info": ":blue"}[inc.severity]
            st.markdown(f"**{inc.id}** {sev_color}[`{inc.severity}`] - `{inc.service}` - {inc.error_type}")
            st.caption(inc.summary)
            with st.expander("evidence"):
                st.code(inc.evidence)

    # Tab: Remediations
    with tab_rem:
        compliance_by_id = {
            c["incident_id"]: c for c in result.get("rag_compliance", [])
        }
        status_emoji = {"ok": "✅", "warn": "⚠️", "fail": "❌"}
        for fid, fix in result["remediations"].items():
            comp = compliance_by_id.get(fid)
            badge = (
                f"{status_emoji.get(comp['status'], '')} RAG: {comp['status']} "
                f"({comp['requirement']})"
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

    # Tab: RAG (the structured payload)
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
                emoji = {"ok": "✅", "warn": "⚠️", "fail": "❌"}[c["status"]]
                st.markdown(
                    f"{emoji} **{c['incident_id']}** "
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

    # Final markdown report.
    st.divider()
    st.markdown(result["report_md"])
