import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Sparkles, 
  Terminal, 
  FileText, 
  Server, 
  Upload,
  Activity
} from 'lucide-react';
import { useIncident, useLiveWorkflow } from '../hooks/useIncidents';
import { useAnalysis } from '../hooks/useAnalysis';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SeverityBadge } from '../components/ui/Badge';
import { cn } from '../utils/cn';

import { RemediationPanel } from '../components/RemediationPanel';
import { CookbookPanel } from '../components/CookbookPanel';
import { AgentWorkflowGraph } from '../components/AgentWorkflowGraph';

function AnalysisMissing({ analyze, logs, isAnalyzing }: { analyze: (l: string) => void, logs: string, isAnalyzing: boolean }) {
  return (
    <Card className="p-12 text-center border-dashed">
      <Sparkles className="w-12 h-12 text-blue-500/30 mx-auto mb-4" />
      <h3 className="text-white font-bold mb-2">No Analysis available</h3>
      <p className="text-sm text-slate-500 mb-8 max-w-xs mx-auto">Load system logs and trigger Gemini AI analysis for automated response suggestions.</p>
      <Button 
        onClick={() => analyze(logs)} 
        disabled={!logs}
        loading={isAnalyzing}
      >
        Run Analysis Engine
      </Button>
    </Card>
  );
}

export function IncidentDetails() {
  const { id } = useParams();
  const { incident, loading } = useIncident(id!);
  const { workflow } = useLiveWorkflow(id!);
  const { analyze, isAnalyzing, analysis, error: analysisError } = useAnalysis();
  const [logs, setLogs] = useState("");
  const [activeTab, setActiveTab] = useState<'analysis' | 'logs' | 'cookbook'>('analysis');

  const onFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogs(e.target?.result as string);
        setActiveTab('logs');
      };
      reader.readAsText(file);
    }
  };

  if (loading || !incident) return <div className="p-8 text-slate-600 font-mono">LOADING_INCIDENT_CONTEXT...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-slate-900 rounded-lg text-slate-400 group">
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white tracking-tight">{incident.id}</h1>
              <SeverityBadge severity={incident.severity} />
            </div>
            <p className="text-slate-400 text-sm mt-1">{incident.title}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">Create War Room</Button>
          <Button size="sm">Resolve Incident</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="flex border-b border-slate-800">
            {['analysis', 'cookbook', 'logs'].map((t) => (
              <button 
                key={t}
                onClick={() => setActiveTab(t as any)}
                className={cn(
                  "px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all relative",
                  activeTab === t ? "text-blue-500" : "text-slate-500"
                )}
              >
                {t}
                {activeTab === t && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
              </button>
            ))}
          </div>

          <div className="min-h-[400px]">
            {activeTab === 'analysis' && (
              <div className="space-y-6">
                {!analysis ? (
                  <AnalysisMissing analyze={analyze} logs={logs} isAnalyzing={isAnalyzing} />
                ) : (
                  <RemediationPanel analysis={analysis} />
                )}
              </div>
            )}

            {activeTab === 'cookbook' && (
              <div className="space-y-8">
                {workflow && (
                  <Card className="p-0 overflow-hidden bg-slate-950/40 border-slate-800">
                    <div className="p-4 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-500" />
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Live Execution Graph</span>
                      </div>
                    </div>
                    <div className="p-6">
                      <AgentWorkflowGraph nodes={workflow.nodes} />
                    </div>
                  </Card>
                )}

                {!analysis ? (
                  <AnalysisMissing analyze={analyze} logs={logs} isAnalyzing={isAnalyzing} />
                ) : (
                  <CookbookPanel analysis={analysis} />
                )}
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-900 p-2 rounded-md border border-slate-800">
                  <div className="flex items-center gap-2 px-2">
                    <Terminal className="w-4 h-4 text-slate-500" />
                    <span className="text-[10px] font-mono text-slate-400">LOG_STREAM_LOADED_OK</span>
                  </div>
                  <label className="cursor-pointer">
                    <input type="file" className="hidden" onChange={onFileUpload} />
                    <Button variant="ghost" size="sm" className="h-7 text-[10px]">
                      <Upload className="w-3 h-3" /> Re-upload
                    </Button>
                  </label>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-6 h-[500px] overflow-auto font-mono text-xs leading-relaxed text-slate-400 selection:bg-blue-500/20">
                  {logs || <div className="text-slate-700 italic">Log buffer empty. Upload operation logs to analyze...</div>}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Card title="Meta" className="p-5">
            <div className="space-y-4 text-xs font-medium">
              <div className="flex justify-between"><span className="text-slate-500 uppercase">Team</span><span className="text-slate-200">{incident.assignedTeam}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 uppercase">Impact</span><span className="text-slate-200">{incident.source}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 uppercase">Created</span><span className="text-slate-200">22:11:57 UTC</span></div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
