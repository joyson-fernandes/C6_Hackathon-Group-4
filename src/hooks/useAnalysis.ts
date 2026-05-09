import { useState } from 'react';
import { apiService } from '../services/apiService';
import { AnalysisResult } from '../types';

export function useAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (logs: string) => {
    if (!logs) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      // First simulate upload
      await apiService.uploadLog(logs);
      // Then analyze
      const result = await apiService.analyzeIncident(logs);
      setAnalysis(result);
      return result;
    } catch (err: any) {
      setError(err.message || "AI Analysis failed. Please check logs and try again.");
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { analyze, isAnalyzing, analysis, error };
}
