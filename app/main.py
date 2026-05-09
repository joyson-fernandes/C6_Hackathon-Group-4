"""Streamlit UI for the Multi-Agent DevOps Incident Analysis Suite.

Streamlit reruns this entire script top-to-bottom every time the user
interacts with a widget (button click, file upload, checkbox toggle).
That means:
  - Local variables don't persist across interactions.
  - Anything you want to keep between reruns must go into st.session_state
    (a global dict-like object Streamlit gives us).

The script flow:
  1. Page setup (title, caption).
  2. Initialize session_state if first run.
  3. Sidebar (always rendered).
  4. File uploader + show input logs if any.
  5. Optional LangGraph DAG image.
  6. Analyze button — when clicked, run the graph and render results.
"""
import sys
from pathlib import Path

# Make sure Python can find the `agents` package when running from the project root.
# Streamlit launches this file directly; it doesn't add the project root to sys.path.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import streamlit as st
from agents.graph import build_graph

# --- Page setup ---------------------------------------------------------
# Must be the FIRST Streamlit call. layout="wide" uses the full screen width.
st.set_page_config(page_title="DevOps Incident Analysis", page_icon=":fire:", layout="wide")
st.title("Multi-Agent DevOps Incident Analysis Suite")
st.caption("Upload ops logs -> 5 agents analyze, remediate, notify, and ticket.")

# --- Session state initialization --------------------------------------
# Persist the uploaded log content across Streamlit reruns. Without this,
# clicking "Analyze" would lose the log content because Streamlit reruns
# the whole script and local variables are reset.
if "logs_text" not in st.session_state:
    st.session_state.logs_text = ""

# --- Sidebar -----------------------------------------------------------
with st.sidebar:
    st.header("Controls")
    show_graph = st.checkbox("Show LangGraph DAG", value=True)
    # Clearing the logs is just resetting the session_state value.
    if st.button("Clear logs", use_container_width=True):
        st.session_state.logs_text = ""

# --- Log input ---------------------------------------------------------
uploaded = st.file_uploader("Upload a log file", type=["log", "txt", "json"])
if uploaded is not None:
    # uploaded.read() returns bytes; decode to UTF-8 (replace bad chars).
    st.session_state.logs_text = uploaded.read().decode("utf-8", errors="ignore")

logs_text = st.session_state.logs_text

# Show the loaded logs back to the user as confirmation.
if logs_text:
    st.text_area("Input logs", logs_text, height=200)
    st.caption(f"{len(logs_text)} chars loaded")

# --- Optional DAG diagram ---------------------------------------------
# Render the LangGraph topology as a PNG so judges can see the agent flow.
# draw_mermaid_png() calls the public mermaid.ink API to render the diagram —
# requires internet. Falls back to mermaid source if it fails.
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
# `disabled=not logs_text` greys out the button until something is uploaded.
if st.button("Analyze", type="primary", disabled=not logs_text):
    graph = build_graph()
    # st.status gives us a collapsible progress widget that updates live.
    with st.status("Running agents...", expanded=True) as status:
        st.write("classifier -> remediation -> cookbook -> slack/jira -> report")
        # The actual graph invocation. This is where all 5 agents run.
        # Returns the FINAL state (every node's contributions merged).
        result = graph.invoke({"raw_logs": logs_text})
        status.update(label="Done", state="complete")

    # --- Render the results in tabs -----------------------------------
    tab1, tab2, tab3, tab4 = st.tabs(["Incidents", "Remediations", "Cookbook", "Notifications"])

    # Tab 1: each detected incident with severity badge + raw evidence.
    with tab1:
        for inc in result["incidents"]:
            # st.markdown supports :red[text] / :orange[text] / :yellow[text] / :blue[text]
            sev_color = {"critical": ":red", "high": ":orange", "warn": ":yellow", "info": ":blue"}[inc.severity]
            st.markdown(f"**{inc.id}** {sev_color}[`{inc.severity}`] - `{inc.service}` - {inc.error_type}")
            st.caption(inc.summary)
            with st.expander("evidence"):
                st.code(inc.evidence)

    # Tab 2: per-incident remediation steps.
    with tab2:
        for fid, fix in result["remediations"].items():
            st.subheader(f"{fid} - risk: {fix.risk}")
            st.write(fix.rationale)
            for n, s in enumerate(fix.steps, 1):
                st.write(f"{n}. {s}")

    # Tab 3: consolidated checklist (clickable boxes for satisfaction).
    with tab3:
        cb = result.get("cookbook")
        if cb:
            st.subheader(cb.title)
            for it in cb.items:
                st.checkbox(it, key=f"cb-{it}")

    # Tab 4: where the agents posted/filed things (or stubs in demo mode).
    with tab4:
        st.write(f"Slack thread: `{result.get('slack_thread_ts')}`")
        st.write(f"JIRA tickets: {result.get('jira_keys', [])}")

    # The full markdown report — handy for copying into a doc.
    st.divider()
    st.markdown(result["report_md"])
