import { AnalysisReport } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const apiService = {
  async analyze(logs: string): Promise<AnalysisReport> {
    if (!logs) throw new Error('LOG_CONTENT_EMPTY');

    const res = await fetch(`${API_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logs }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => res.statusText);
      throw new Error(`ANALYZE_FAILED: ${detail}`);
    }

    return (await res.json()) as AnalysisReport;
  },

  async health(): Promise<boolean> {
    try {
      const res = await fetch(`${API_URL}/api/health`);
      return res.ok;
    } catch {
      return false;
    }
  },
};
