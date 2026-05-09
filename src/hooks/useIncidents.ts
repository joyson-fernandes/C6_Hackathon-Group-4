import { useState, useEffect } from 'react';
import { Incident, WorkflowExecution, IntegrationStatus } from '../types';
import { apiService } from '../services/apiService';

export function useIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    apiService.fetchIncidents()
      .then(data => {
        if (mounted) {
          setIncidents(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, []);

  return { incidents, loading, error };
}

export function useIncident(id: string) {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiService.fetchIncidentById(id)
      .then(data => {
        if (mounted) {
          setIncident(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (mounted) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, [id]);

  return { incident, loading, error };
}

export function useWorkflow(incidentId: string) {
  const [workflow, setWorkflow] = useState<WorkflowExecution | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    apiService.fetchWorkflowStatus(incidentId)
      .then(data => {
        if (mounted) {
          setWorkflow(data);
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, [incidentId]);

  return { workflow, loading };
}

export function useLiveWorkflow(incidentId: string) {
  const [workflow, setWorkflow] = useState<WorkflowExecution | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    // Initial fetch
    apiService.fetchWorkflowStatus(incidentId).then(data => {
      if (mounted) {
        setWorkflow(data);
        setLoading(false);
      }
    });

    // Subscribe to updates
    const unsubscribe = apiService.subscribeToWorkflow(incidentId, (updated) => {
      if (mounted) {
        setWorkflow(updated);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [incidentId]);

  return { workflow, loading };
}

export function useIntegrations() {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    apiService.fetchNotifications()
      .then(data => {
        if (mounted) {
          setIntegrations(data);
          setLoading(false);
        }
      });
    return () => { mounted = false; };
  }, []);

  return { integrations, loading };
}
