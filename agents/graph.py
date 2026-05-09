"""LangGraph orchestrator — wires every agent together as a directed graph.

LangGraph mental model:
  - Nodes are functions: (State) -> partial_state_dict
  - Edges define the order: A -> B means "after A finishes, run B".
  - State is a TypedDict shared across all nodes; each node's return dict
    is merged into it.
  - START and END are special sentinel nodes built into LangGraph.

Our DAG:
        START
          v
       classify
          v
      remediate
          v
       cookbook
        /     \\
     slack    jira     <-- these run sequentially in this implementation;
        \\     /          could be parallelized later.
         report
          v
         END
"""
from langgraph.graph import StateGraph, START, END
from .models import State
from .classifier import classify
from .remediation import remediate
from .cookbook import synthesize
from .notifier import notify_slack, file_jira


def build_report(state: State) -> dict:
    """Final node: render everything as a single Markdown string for the UI.

    This is plain Python — no LLM call. We just walk through the state and
    assemble a readable report.
    """
    lines = ["# Incident Analysis Report\n"]
    lines.append(f"**{len(state['incidents'])} incidents** classified.\n")

    # Per-incident sections.
    for inc in state["incidents"]:
        fix = state["remediations"].get(inc.id)
        lines.append(f"## {inc.id} — {inc.error_type} on `{inc.service}` ({inc.severity})")
        lines.append(f"{inc.summary}\n")
        if fix:
            lines.append(f"**Fix rationale:** {fix.rationale}\n")
            lines.append("**Steps:**")
            for n, s in enumerate(fix.steps, 1):
                lines.append(f"{n}. {s}")
            lines.append("")

    # Append the consolidated cookbook checklist.
    if cb := state.get("cookbook"):
        lines.append(f"\n# {cb.title}")
        for it in cb.items:
            lines.append(f"- [ ] {it}")

    # Footer with notification references.
    if state.get("slack_thread_ts"):
        lines.append(f"\n_Slack thread: `{state['slack_thread_ts']}`_")
    if keys := state.get("jira_keys"):
        lines.append(f"_JIRA tickets: {', '.join(keys)}_")

    return {"report_md": "\n".join(lines)}


def build_graph():
    """Construct and compile the LangGraph DAG.

    The compiled graph is a Runnable — call .invoke({"raw_logs": "..."})
    on it and it walks every node in order, returning the final state.
    """
    # Create a graph that uses our State TypedDict as the shared state shape.
    g = StateGraph(State)

    # Register every node by name. Order doesn't matter here — edges define flow.
    g.add_node("classify", classify)
    g.add_node("remediate", remediate)
    g.add_node("cookbook", synthesize)
    g.add_node("slack", notify_slack)
    g.add_node("jira", file_jira)
    g.add_node("report", build_report)

    # Wire up the edges. add_edge(A, B) = "run B after A".
    g.add_edge(START, "classify")
    g.add_edge("classify", "remediate")
    g.add_edge("remediate", "cookbook")
    # Cookbook fans out to slack and jira (both run, in some order).
    g.add_edge("cookbook", "slack")
    g.add_edge("cookbook", "jira")
    # Both notification nodes feed into the final report.
    g.add_edge("slack", "report")
    g.add_edge("jira", "report")
    g.add_edge("report", END)

    # compile() validates the graph and returns an executable Runnable.
    return g.compile()
