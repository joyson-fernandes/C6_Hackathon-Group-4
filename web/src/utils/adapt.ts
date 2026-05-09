import {
  AgentNode,
  AnalysisReport,
  AnalysisResult,
  AnalysisRun,
  BackendFix,
  BackendIncident,
  BackendSeverity,
  Incident,
  IncidentStatus,
  IntegrationStatus,
  Severity,
  WorkflowExecution,
} from '../types';

const SEVERITY_MAP: Record<BackendSeverity, Severity> = {
  critical: 'P0',
  high: 'P1',
  warn: 'P2',
  info: 'P3',
};

export function toFrontendSeverity(s: BackendSeverity): Severity {
  return SEVERITY_MAP[s] ?? 'P4';
}

function statusFor(severity: BackendSeverity, hasFix: boolean): IncidentStatus {
  if (!hasFix) return 'analyzing';
  if (severity === 'critical' || severity === 'high') return 'remediating';
  return 'active';
}

export function toIncident(
  inc: BackendIncident,
  fix: BackendFix | undefined,
  run: AnalysisRun
): Incident {
  return {
    id: inc.id,
    title: inc.summary || inc.error_type,
    status: statusFor(inc.severity, !!fix),
    severity: toFrontendSeverity(inc.severity),
    timestamp: inc.first_seen ?? run.startedAt,
    source: run.fileName ?? 'log upload',
    serviceName: inc.service,
    incidentType: inc.error_type,
    assignedWorkflow: fix?.runbook_ref ?? 'auto-classified',
    shortDescription: inc.summary,
    assignedTeam: inc.service,
    slackChannel: run.report.slack_thread_ts ?? undefined,
    jiraTicket: run.report.jira_keys[0],
  };
}

export function toAnalysisResult(
  inc: BackendIncident,
  fix: BackendFix | undefined,
  report: AnalysisReport
): AnalysisResult {
  return {
    severity: toFrontendSeverity(inc.severity),
    summary: inc.summary,
    rootCause: fix?.rationale ?? 'No remediation generated.',
    remediationSteps: fix?.steps ?? [],
    confidence: report.rag_confidence === 'high' ? 0.9 :
                report.rag_confidence === 'medium' ? 0.7 :
                report.rag_confidence === 'low' ? 0.5 : undefined,
    reasoning: report.rag_sources.length > 0
      ? `Grounded in runbook(s): ${report.rag_sources.join(', ')}`
      : undefined,
    operationalImpact: inc.evidence,
    serviceAffected: inc.service,
    recommendedEscalation: inc.severity === 'critical' ? 'L3' :
                           inc.severity === 'high' ? 'L2' : 'L1',
    validationSteps: undefined,
    rollbackPlan: fix?.risk === 'high' ? [`Risk flagged ${fix.risk} — verify rollback path before applying.`] : undefined,
    estimatedTime: undefined,
  };
}

export function toWorkflowExecution(run: AnalysisRun, incidentId: string): WorkflowExecution {
  const r = run.report;
  const completed = (output: string): AgentNode['status'] => 'completed';

  const nodes: AgentNode[] = [
    {
      id: 'classify',
      name: 'Classifier',
      description: 'Reads raw logs and extracts typed incidents.',
      status: completed(''),
      output: `Extracted ${r.incidents.length} incident${r.incidents.length === 1 ? '' : 's'}.`,
    },
    {
      id: 'remediate',
      name: 'Remediation',
      description: 'Generates per-incident fix grounded in runbook KB.',
      status: completed(''),
      output: `Generated ${Object.keys(r.remediations).length} fix${Object.keys(r.remediations).length === 1 ? '' : 'es'}. RAG confidence: ${r.rag_confidence}.`,
    },
    {
      id: 'cookbook',
      name: 'Cookbook',
      description: 'Synthesizes a consolidated runbook checklist.',
      status: completed(''),
      output: r.cookbook ? `Compiled "${r.cookbook.title}" with ${r.cookbook.items.length} items.` : 'No checklist produced.',
    },
    {
      id: 'slack',
      name: 'Slack Notifier',
      description: 'Posts threaded incident messages to Slack.',
      status: r.slack_thread_ts && r.slack_thread_ts !== 'not-implemented' ? 'completed' : 'pending',
      output: r.slack_thread_ts === 'not-implemented' ? 'Stub — implement notify_slack to enable.' : (r.slack_thread_ts ?? undefined),
    },
    {
      id: 'jira',
      name: 'JIRA Ticketer',
      description: 'Files JIRA tickets for high/critical incidents.',
      status: r.jira_keys.length > 0 ? 'completed' : 'pending',
      output: r.jira_keys.length > 0 ? `Filed: ${r.jira_keys.join(', ')}` : 'Stub — implement file_jira to enable.',
    },
    {
      id: 'report',
      name: 'Report Builder',
      description: 'Renders the final markdown report.',
      status: r.report_md ? 'completed' : 'pending',
      output: r.report_md ? `Rendered ${r.report_md.length} chars of markdown.` : undefined,
    },
  ];

  return {
    id: run.runId,
    incidentId,
    startedAt: run.startedAt,
    nodes,
  };
}

export function toIntegrations(run: AnalysisRun | null): IntegrationStatus[] {
  if (!run) return [];
  const r = run.report;

  const slackOk = !!r.slack_thread_ts && r.slack_thread_ts !== 'not-implemented';
  const jiraOk = r.jira_keys.length > 0;

  return [
    {
      id: 'slack',
      name: 'Slack Notifier',
      type: 'notification',
      status: slackOk ? 'healthy' : 'offline',
      latency: '—',
      uptime: slackOk ? 'connected' : 'stub',
      lastExecution: {
        timestamp: run.startedAt,
        status: slackOk ? 'success' : 'failure',
        retryCount: 0,
        payload: undefined,
        response: r.slack_thread_ts ?? 'not-implemented',
      },
    },
    {
      id: 'jira',
      name: 'JIRA Ticketer',
      type: 'ticketing',
      status: jiraOk ? 'healthy' : 'offline',
      latency: '—',
      uptime: jiraOk ? 'connected' : 'stub',
      lastExecution: {
        timestamp: run.startedAt,
        status: jiraOk ? 'success' : 'failure',
        retryCount: 0,
        payload: undefined,
        response: r.jira_keys.length ? r.jira_keys.join(', ') : 'no tickets filed',
      },
    },
    {
      id: 'rag',
      name: 'Knowledge Base (BM25)',
      type: 'monitoring',
      status: r.rag_confidence === 'none' ? 'degraded' : 'healthy',
      latency: '—',
      uptime: r.rag_confidence,
      lastExecution: {
        timestamp: run.startedAt,
        status: r.rag_sources.length > 0 ? 'success' : 'failure',
        retryCount: 0,
        payload: undefined,
        response: r.rag_sources.join(', ') || 'no sources matched',
      },
    },
  ];
}
