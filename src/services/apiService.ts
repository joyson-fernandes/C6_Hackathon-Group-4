import { 
  Incident, 
  WorkflowExecution, 
  AnalysisResult, 
  IntegrationStatus,
  AgentStep
} from '../types';

import { 
  MOCK_INCIDENTS, 
  MOCK_WORKFLOW, 
  MOCK_INTEGRATIONS,
  MOCK_AGENT_STEPS 
} from '../utils/constants';

const DELAY = 800; // Average simulated latency in ms

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const apiService = {

  /**
   * Upload raw logs for analysis
   */
  async uploadLog(content: string): Promise<{ success: boolean; logId: string }> {
    if (!content) throw new Error('LOG_CONTENT_EMPTY');

    const res = await fetch(import.meta.env.VITE_N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logs: content })
    });

    if (!res.ok) throw new Error("N8N_WEBHOOK_FAILED");

    return { success: true, logId: `LOG-${Date.now()}` };
  },

  /**
   * Trigger AI analysis on an incident
   */
  async analyzeIncident(logContent: string): Promise<AnalysisResult> {
    const res = await fetch(import.meta.env.VITE_N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ logs: logContent })
    });

    if (!res.ok) throw new Error("N8N_ANALYSIS_FAILED");

    return await res.json();
  },

  /**
   * Fetch all active and past incidents
   */
  async fetchIncidents(): Promise<Incident[]> {
    await sleep(DELAY);
    return [...MOCK_INCIDENTS];
  },

  /**
   * Fetch details for a specific incident
   */
  async fetchIncidentById(id: string): Promise<Incident> {
    await sleep(DELAY / 2);
    const incident = MOCK_INCIDENTS.find(i => i.id === id);
    if (!incident) throw new Error('INCIDENT_NOT_FOUND');
    return incident;
  },

  /**
   * Fetch execution trail for agents
   */
  async fetchAgentExecution(): Promise<AgentStep[]> {
    await sleep(DELAY);
    return [...MOCK_AGENT_STEPS];
  },

  /**
   * Fetch current workflow status
   */
  async fetchWorkflowStatus(incidentId: string): Promise<WorkflowExecution> {
    await sleep(DELAY);
    return { ...MOCK_WORKFLOW, incidentId };
  },

  /**
   * Fetch specific remediation checklist
   */
  async fetchRemediation(incidentId: string): Promise<string[]> {
    await sleep(DELAY);
    return [
      "Verify cluster connectivity",
      "Scale deployment to 5 replicas",
      "Update internal DNS routing"
    ];
  },

  /**
   * Subscribe to workflow updates (Simulated Streaming)
   */
  subscribeToWorkflow(incidentId: string, onUpdate: (workflow: WorkflowExecution) => void) {
    let currentNodes = JSON.parse(JSON.stringify(MOCK_WORKFLOW.nodes));
    let iteration = 0;

    const interval = setInterval(() => {
      iteration++;

      let changed = false;
      const runningIdx = currentNodes.findIndex((n: any) => n.status === 'running');
      const pendingIdx = currentNodes.findIndex((n: any) => n.status === 'pending');

      if (runningIdx !== -1) {
        currentNodes[runningIdx].status = 'completed';
        currentNodes[runningIdx].duration = `${(Math.random() * 2 + 1).toFixed(1)}s`;
        changed = true;
      }

      if (pendingIdx !== -1) {
        currentNodes[pendingIdx].status = 'running';
        currentNodes[pendingIdx].duration = '0s';
        changed = true;
      }

      if (changed) {
        onUpdate({
          ...MOCK_WORKFLOW,
          incidentId,
          nodes: [...currentNodes]
        });
      }

      if (pendingIdx === -1 && runningIdx === -1) {
        currentNodes = JSON.parse(JSON.stringify(MOCK_WORKFLOW.nodes));
      }
    }, 4000);

    return () => clearInterval(interval);
  },

  /**
   * Fetch integration and notification delivery statuses
   */
  async fetchNotifications(): Promise<IntegrationStatus[]> {
    await sleep(DELAY);
    return [...MOCK_INTEGRATIONS];
  }
};
