"""Slack + JIRA notification agents need to implement."""

from .models import State


def notify_slack(state: State) -> dict:
    return {"slack_thread_ts": "not-implemented"}


def file_jira(state: State) -> dict:
    return {"jira_keys": []}
