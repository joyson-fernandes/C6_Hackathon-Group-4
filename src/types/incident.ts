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
  confidence: number;
  reasoning: string;
  operationalImpact: string;
  serviceAffected: string;
  recommendedEscalation: string;
  validationSteps?: string[];
  rollbackPlan?: string[];
  estimatedTime?: string;
}
