export type Severity = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';
export type IncidentStatus = 'active' | 'analyzing' | 'remediating' | 'resolved' | 'closed';

export interface Incident {
  id: string;
  title: string;
  status: IncidentStatus;
  severity: Severity;
  timestamp: string;
  source: string;
  serviceName: string;
  incidentType: string;
  assignedWorkflow: string;
  shortDescription: string;
  assignedTeam: string;
  slackChannel?: string;
  jiraTicket?: string;
  githubIssue?: string;
}

export interface AgentStep {
  id: string;
  agentName: string;
  action: string;
  timestamp: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
}

export interface IntegrationStatus {
  id: string;
  name: string;
  type: 'notification' | 'ticketing' | 'webhook' | 'monitoring';
  status: 'healthy' | 'degraded' | 'offline' | 'unknown';
  latency: string;
  uptime: string;
  lastExecution: {
    timestamp: string;
    status: 'success' | 'failure';
    retryCount: number;
    payload?: string;
    response?: string;
  };
}

export interface AnalysisResult {
  severity: Severity;
  summary: string;
  rootCause: string;
  remediationSteps: string[];
  confidence?: number;
  reasoning?: string;
  operationalImpact?: string;
  serviceAffected?: string;
  recommendedEscalation?: string;
  validationSteps?: string[];
  rollbackPlan?: string[];
  estimatedTime?: string;
}

// --- Backend (Python LangGraph) shapes ---

export type BackendSeverity = 'info' | 'warn' | 'high' | 'critical';
export type RagConfidence = 'high' | 'medium' | 'low' | 'none';

export interface BackendIncident {
  id: string;
  service: string;
  error_type: string;
  severity: BackendSeverity;
  summary: string;
  evidence: string;
  first_seen?: string | null;
}

export interface BackendFix {
  incident_id: string;
  rationale: string;
  steps: string[];
  risk: 'low' | 'medium' | 'high';
  runbook_ref?: string | null;
}

export interface BackendChecklist {
  title: string;
  items: string[];
}

export interface RagComplianceEntry {
  incident_id: string;
  severity: BackendSeverity;
  requirement: string;
  status: 'ok' | 'warn' | 'fail';
  reason: string;
  rag_confidence: RagConfidence;
  runbook_ref?: string | null;
}

export interface AnalysisReport {
  incidents: BackendIncident[];
  remediations: Record<string, BackendFix>;
  cookbook: BackendChecklist | null;
  report_md: string;
  rag_sources: string[];
  rag_confidence: RagConfidence;
  rag_compliance: RagComplianceEntry[];
  slack_thread_ts: string | null;
  jira_keys: string[];
}

export interface AnalysisRun {
  runId: string;
  startedAt: string;
  fileName?: string;
  report: AnalysisReport;
}
