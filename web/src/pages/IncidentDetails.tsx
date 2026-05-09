import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ChevronLeft,
  Sparkles,
  Terminal,
  Upload,
  Activity,
  Inbox,
} from 'lucide-react';
import { useIncident, useLiveWorkflow } from '../hooks/useIncidents';
import { useAnalysis } from '../hooks/useAnalysis';
import { useAnalysisStore } from '../store/AnalysisStore';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { SeverityBadge } from '../components/ui/Badge';
import { cn } from '../utils/cn';

import { RemediationPanel } from '../components/RemediationPanel';
import { CookbookPanel } from '../components/CookbookPanel';
import { AgentWorkflowGraph } from '../components/AgentWorkflowGraph';

function NoAnalysisYet() {
  return (
    <Card className="p-12 text-center border-dashed">
      <Sparkles className="w-12 h-12 text-blue-500/30 mx-auto mb-4" />
      <h3 className="text-white font-bold mb-2">No analysis attached to this incident</h3>
      <p className="text-sm text-slate-500 max-w-xs mx-auto">
        Re-run the pipeline from the Dashboard with the source log to populate this view.
      </p>
    </Card>
  );
}

export function IncidentDetails() {
  const { id } = useParams();
  const { incident } = useIncident(id!);
  const { workflow } = useLiveWorkflow(id!);
  const { runs } = useAnalysisStore();
  const run = runs.find(r => r.report.incidents.some(i => i.id === id));
  const report = run?.report;
  const { analysis, analyze, isAnalyzing, error: analysisError } = useAnalysis({
    asAnalysisResult: true,
    incidentId: id,
  });
  const [logs, setLogs] = useState('');
  const [activeTab, setActiveTab] = useState<'analysis' | 'logs' | 'cookbook'>('analysis');

  const onFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        setLogs(content);
        setActiveTab('logs');
        analyze(content, file.name);
      };
      reader.readAsText(file);
    }
  };

  if (!incident) {
    return (
      <div className="max-w-3xl mx-auto py-16 flex flex-col items-center justify-center text-center space-y-4">
        <Inbox className="w-10 h-10 text-slate-600" />
        <p className="text-sm text-slate-400">Incident <span className="font-mono">{id}</span> not found in any local run.</p>
        <Link to="/" className="text-xs font-bold text-blue-500 hover:underline">Back to dashboard</Link>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
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
          <label className="cursor-pointer">
            <input type="file" className="hidden" accept=".log,.txt,.json" onChange={onFileUpload} />
            <Button variant="outline" size="sm" loading={isAnalyzing} disabled={isAnalyzing}>
              <Upload className="w-3 h-3" /> Re-run with new logs
            </Button>
          </label>
        </div>
      </div>

      {analysisError && (
        <div className="p-3 rounded-lg bg-red-950/20 border border-red-900/50 text-xs text-red-200 break-all">
          {analysisError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="flex border-b border-slate-800">
            {(['analysis', 'cookbook', 'logs'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={cn(
                  'px-6 py-3 text-xs font-bold uppercase tracking-widest transition-all relative',
                  activeTab === t ? 'text-blue-500' : 'text-slate-500'
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
                {!analysis ? <NoAnalysisYet /> : <RemediationPanel analysis={analysis} />}
              </div>
            )}

            {activeTab === 'cookbook' && (
              <div className="space-y-8">
                {workflow && (
                  <Card className="p-0 overflow-hidden bg-slate-950/40 border-slate-800">
                    <div className="p-4 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-500" />
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Agent Pipeline</span>
                      </div>
                    </div>
                    <div className="p-6">
                      <AgentWorkflowGraph nodes={workflow.nodes} report={report} />
                    </div>
                  </Card>
                )}

                {!analysis ? <NoAnalysisYet /> : <CookbookPanel analysis={analysis} />}
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-900 p-2 rounded-md border border-slate-800">
                  <div className="flex items-center gap-2 px-2">
                    <Terminal className="w-4 h-4 text-slate-500" />
                    <span className="text-[10px] font-mono text-slate-400">LOG_BUFFER</span>
                  </div>
                  <label className="cursor-pointer">
                    <input type="file" className="hidden" accept=".log,.txt,.json" onChange={onFileUpload} />
                    <Button variant="ghost" size="sm" className="h-7 text-[10px]">
                      <Upload className="w-3 h-3" /> Upload &amp; re-analyze
                    </Button>
                  </label>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-6 h-[500px] overflow-auto font-mono text-xs leading-relaxed text-slate-400 selection:bg-blue-500/20 whitespace-pre-wrap">
                  {logs || <div className="text-slate-700 italic">Log buffer empty. Upload a file to attach raw logs.</div>}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Card title="Meta" className="p-5">
            <div className="space-y-4 text-xs font-medium">
              <Row label="Service" value={incident.serviceName} />
              <Row label="Type" value={incident.incidentType} />
              <Row label="Source" value={incident.source} />
              <Row label="First seen" value={new Date(incident.timestamp).toLocaleString()} />
              {incident.slackChannel && <Row label="Slack" value={incident.slackChannel} />}
              {incident.jiraTicket && <Row label="JIRA" value={incident.jiraTicket} />}
            </div>
          </Card>

          {report && (
            <Card title="Pipeline" className="p-5">
              <div className="space-y-4 text-xs font-medium">
                <Row label="Run severity" value={report.severity ?? '—'} />
                <Row label="Routing path" value={report.routing_path ?? '—'} mono />
                <Row label="Validator" value={report.validator_status ?? '—'} />
                <Row label="Quality" value={report.quality_score != null ? `${report.quality_score}/10` : '—'} />
                <Row label="Retries" value={String(report.retry_count)} />
                {report.usage && <Row label="LLM calls" value={String(report.usage.llm_calls)} />}
                {report.usage && <Row label="Tokens" value={report.usage.total_tokens.toLocaleString()} />}
                {report.usage && <Row label="Cost" value={`$${report.usage.total_cost_usd.toFixed(4)}`} mono />}
                {report.human_approval_status && (
                  <Row label="Human approval" value={report.human_approval_status} />
                )}
                {report.escalation_required && (
                  <Row label="Escalation" value="required" />
                )}
              </div>
              {report.execution_path.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Execution path</p>
                  <p className="text-[10px] font-mono text-slate-400 break-all leading-relaxed">
                    {report.execution_path.join(' → ')}
                  </p>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500 uppercase">{label}</span>
      <span className={cn('text-slate-200 text-right break-all', mono && 'font-mono text-[11px]')}>{value}</span>
    </div>
  );
}
