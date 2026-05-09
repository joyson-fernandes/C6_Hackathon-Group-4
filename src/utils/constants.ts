import { Incident, AgentStep, WorkflowExecution, IntegrationStatus } from '../types';

export const MOCK_INCIDENTS: Incident[] = [
  {
    id: 'INC-2026-001',
    title: 'High Latency on Auth Service',
    status: 'active',
    severity: 'P1',
    timestamp: new Date().toISOString(),
    source: 'Datadog',
    serviceName: 'authentication-api',
    incidentType: 'Latency Degradation',
    assignedWorkflow: 'Standard-API-Recovery',
    shortDescription: 'Spike in p99 latency detected in us-east-1 region for /login endpoint.',
    assignedTeam: 'Auth-Platform',
    slackChannel: '#ops-incident-auth-2026-001',
    jiraTicket: 'AUTH-1234'
  },
  {
    id: 'INC-2026-002',
    title: 'Database Connection Pool Exhaustion',
    status: 'analyzing',
    severity: 'P0',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    source: 'CloudWatch',
    serviceName: 'customer-db-primary',
    incidentType: 'Resource Exhaustion',
    assignedWorkflow: 'DB-Scalability-Autofix',
    shortDescription: 'Production RDSPostgres instance is rejecting connections due to pool limit.',
    assignedTeam: 'DBRE',
    slackChannel: '#ops-incident-db-leak',
    jiraTicket: 'DB-882',
    githubIssue: 'https://github.com/owner/repo/issues/456'
  },
  {
    id: 'INC-2026-003',
    title: 'DNS Resolution Failure on Internal Mesh',
    status: 'remediating',
    severity: 'P0',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    source: 'Prometheus',
    serviceName: 'core-networking-dns',
    incidentType: 'Connectivity Loss',
    assignedWorkflow: 'Network-Bypass-Plan',
    shortDescription: 'Internal service discovery failing due to stale DNS cache in Istio sidecars.',
    assignedTeam: 'Platform-Networking',
    jiraTicket: 'NET-991'
  },
  {
    id: 'INC-2026-004',
    title: 'OOM Kill Loop in Payment Worker',
    status: 'resolved',
    severity: 'P2',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    source: 'Kubernetes',
    serviceName: 'payment-processor',
    incidentType: 'Service Instability',
    assignedWorkflow: 'JVM-Memory-Tuning',
    shortDescription: 'Payment workers crashing due to memory leak after v2.4.1 deployment.',
    assignedTeam: 'Payments-Dev',
    jiraTicket: 'PAY-44'
  }
];

export const MOCK_INTEGRATIONS: IntegrationStatus[] = [
  {
    id: 'int-1',
    name: 'Slack Notification Service',
    type: 'notification',
    status: 'healthy',
    latency: '45ms',
    uptime: '99.99%',
    lastExecution: {
      timestamp: new Date().toISOString(),
      status: 'success',
      retryCount: 0,
      payload: '{"text": "Incident INC-2026-001 created", "channel": "#ops-auth"}',
      response: '{"ok": true, "ts": "123456789.001"}'
    }
  },
  {
    id: 'int-2',
    name: 'JIRA Cloud Connector',
    type: 'ticketing',
    status: 'degraded',
    latency: '850ms',
    uptime: '98.5%',
    lastExecution: {
      timestamp: new Date(Date.now() - 300000).toISOString(),
      status: 'failure',
      retryCount: 2,
      payload: '{"fields": {"project": {"key": "AUTH"}, "summary": "High Latency..."}}',
      response: '{"error": "Internal Server Error", "code": 500}'
    }
  },
  {
    id: 'int-5',
    name: 'GitHub Issues Connector',
    type: 'ticketing',
    status: 'healthy',
    latency: '200ms',
    uptime: '99.9%',
    lastExecution: {
      timestamp: new Date(Date.now() - 120000).toISOString(),
      status: 'success',
      retryCount: 0,
      payload: '{"title": "[P0] Database Connection Pool Exhaustion", "body": "...", "labels": ["incident", "p0", "customer-db-primary"]}',
      response: '{"html_url": "https://github.com/owner/repo/issues/123"}'
    }
  },
  {
    id: 'int-3',
    name: 'OpsGenie Webhook',
    type: 'webhook',
    status: 'healthy',
    latency: '120ms',
    uptime: '99.95%',
    lastExecution: {
      timestamp: new Date(Date.now() - 600000).toISOString(),
      status: 'success',
      retryCount: 1,
      payload: '{"alias": "INC-001", "message": "P0: Auth Failure"}',
      response: '{"result": "Request will be processed", "took": 12, "requestId": "..."}'
    }
  },
  {
    id: 'int-4',
    name: 'Datadog Metric Export',
    type: 'monitoring',
    status: 'healthy',
    latency: '32ms',
    uptime: '100%',
    lastExecution: {
      timestamp: new Date(Date.now() - 60000).toISOString(),
      status: 'success',
      retryCount: 0
    }
  }
];

export const MOCK_AGENT_STEPS: AgentStep[] = [
  { id: '1', agentName: 'LogAnalyzer', action: 'Extracting error patterns from /var/log/auth.log', timestamp: new Date(Date.now() - 50000).toISOString(), status: 'completed' },
  { id: '2', agentName: 'NetworkSage', action: 'Probing VPC flow logs for unusual egress traffic', timestamp: new Date(Date.now() - 40000).toISOString(), status: 'completed' },
  { id: '3', agentName: 'ConfigAuditor', action: 'Comparing current k8s deployment spec with previous healthy state', timestamp: new Date(Date.now() - 30000).toISOString(), status: 'running' },
];

export const MOCK_WORKFLOW: WorkflowExecution = {
  id: 'WF-772',
  incidentId: 'INC-2026-001',
  startedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  nodes: [
    {
      id: 'agent-1',
      name: 'Log Parser Agent',
      description: 'Ingesting and normalizing raw system logs into structured events.',
      status: 'completed',
      duration: '1.2s',
      tokens: 450,
      output: 'Successfully extracted 124 error events from auth.log.'
    },
    {
      id: 'agent-2',
      name: 'Severity Classification',
      description: 'Analyzing impact metrics to determine incident priority level.',
      status: 'completed',
      duration: '0.8s',
      tokens: 280,
      output: 'Classified as P1 due to high-latency impact on 15% of total user traffic.'
    },
    {
      id: 'agent-3',
      name: 'Remediation Agent',
      description: 'Searching knowledge base for historical patterns and suggesting fixes.',
      status: 'running',
      duration: '4.5s',
      tokens: 1200,
      output: 'Currently analyzing previous RDS connection leak patterns...'
    },
    {
      id: 'agent-4',
      name: 'Cookbook Generator',
      description: 'Generating step-by-step technical instructions for on-call SREs.',
      status: 'pending'
    },
    {
      id: 'agent-5',
      name: 'Slack Notification',
      description: 'Broadcasting incident status and war-room details to #ops-alerts.',
      status: 'pending'
    },
    {
      id: 'agent-6',
      name: 'JIRA Ticket Agent',
      description: 'Creating/Updating tracking ticket with latest AI analysis artifacts.',
      status: 'pending'
    }
  ]
};
