import { useState } from 'react';
import { apiService } from '../services/apiService';
import { useAnalysisStore } from '../store/AnalysisStore';
import { AnalysisReport, AnalysisResult } from '../types';
import { toAnalysisResult } from '../utils/adapt';

interface UseAnalysisOptions {
  /** Map the multi-incident report into a single AnalysisResult for legacy panels. */
  asAnalysisResult?: boolean;
  /** Pick a specific incident from the report to convert. */
  incidentId?: string;
}

export function useAnalysis(opts: UseAnalysisOptions = {}) {
  const { recordRun, current } = useAnalysisStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (logs: string, fileName?: string): Promise<AnalysisReport | undefined> => {
    if (!logs) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const report = await apiService.analyze(logs);
      recordRun(report, fileName);
      return report;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Analysis failed.';
      setError(msg);
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  let analysisResult: AnalysisResult | null = null;
  if (opts.asAnalysisResult && current) {
    const inc = opts.incidentId
      ? current.report.incidents.find(i => i.id === opts.incidentId)
      : current.report.incidents[0];
    if (inc) {
      analysisResult = toAnalysisResult(inc, current.report.remediations[inc.id], current.report);
    }
  }

  return {
    analyze,
    isAnalyzing,
    error,
    report: current?.report ?? null,
    analysis: analysisResult,
  };
}
