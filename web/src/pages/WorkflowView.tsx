import { motion } from 'motion/react';
import { Zap, Terminal, Activity, Inbox, GitBranch, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useAnalysisStore } from '../store/AnalysisStore';
import { summarizeRun, toWorkflowExecution } from '../utils/adapt';
import { cn } from '../utils/cn';
import { Card } from '../components/ui/Card';
import { AgentWorkflowGraph } from '../components/AgentWorkflowGraph';
import { ValidatorStatus } from '../types';

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/30',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  low: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  info: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

const VALIDATOR_STYLES: Record<ValidatorStatus, string> = {
  approved: 'bg-green-500/10 text-green-400 border-green-500/30',
  needs_revision: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  escalate: 'bg-red-500/10 text-red-400 border-red-500/30',
};

export function WorkflowView() {
  const { current } = useAnalysisStore();

  if (!current || current.report.incidents.length === 0) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4 text-center">
        <Inbox className="w-10 h-10 text-slate-600" />
        <div>
          <p className="text-sm font-bold text-white">No workflow runs yet</p>
          <p className="text-xs font-mono text-slate-500 mt-1 uppercase tracking-widest">Upload a log to populate the agent graph</p>
        </div>
      </div>
    );
  }

  const incidentId = current.report.incidents[0].id;
  const workflow = toWorkflowExecution(current, incidentId);
  const summary = summarizeRun(current.report);
  const flags = summary.flags;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-slate-900/40 p-6 border border-slate-800 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[10px] font-mono font-bold text-blue-500 uppercase tracking-[0.2em] bg-blue-500/10 px-2 py-0.5 rounded">LangGraph Pipeline</span>
            <span className="text-slate-600">/</span>
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">{workflow.id}</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter">Multi-Agent Workflow</h1>
          <p className="text-slate-400 mt-1 max-w-xl text-sm">{summary.routingReason}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <SummaryBadge label="Severity" value={summary.severity} className={SEVERITY_STYLES[summary.severity] ?? SEVERITY_STYLES.info} />
          <SummaryBadge
            label="Validator"
            value={summary.validatorStatus}
            className={current.report.validator_status ? VALIDATOR_STYLES[current.report.validator_status] : 'bg-slate-700/30 text-slate-400 border-slate-700'}
          />
          <SummaryBadge label="Quality" value={summary.qualityScore} className="bg-blue-500/10 text-blue-400 border-blue-500/30" />
          <SummaryBadge label="Retries" value={String(summary.retryCount)} className="bg-slate-700/30 text-slate-400 border-slate-700" />
          {current.report.usage && (
            <SummaryBadge
              label="Cost"
              value={`$${current.report.usage.total_cost_usd.toFixed(4)}`}
              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
            />
          )}
          {current.report.usage && (
            <SummaryBadge
              label="Tokens"
              value={current.report.usage.total_tokens.toLocaleString()}
              className="bg-slate-700/30 text-slate-300 border-slate-700"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Routing Decision" icon={<GitBranch className="w-4 h-4 text-blue-500" />}>
          <dl className="text-xs space-y-3 mt-2">
            <Row label="Path" value={summary.routingPath} mono />
            <Row label="Incident type" value={current.report.incident_type ?? '—'} mono />
            <Row label="RAG snippets" value={String(current.report.rag_snippet_count)} />
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(flags).map(([k, v]) => (
              <span key={k} className={cn(
                'px-2 py-0.5 text-[10px] font-mono rounded border',
                v ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'
              )}>
                {k.replace('requires_', '')}{v ? ' ✓' : ''}
              </span>
            ))}
          </div>
        </Card>

        <Card title="Validator Verdict" icon={<ShieldCheck className="w-4 h-4 text-blue-500" />}>
          <dl className="text-xs space-y-3 mt-2">
            <Row label="Status" value={summary.validatorStatus} />
            <Row label="Quality score" value={summary.qualityScore} />
            <Row label="Retry count" value={String(summary.retryCount)} />
            <Row label="Human approval" value={summary.humanApproval} />
            <Row label="Escalation" value={current.report.escalation_required ? 'required' : 'not required'} />
          </dl>
          {current.report.validation_reason && (
            <p className="mt-4 text-xs text-slate-400 italic border-l-2 border-slate-800 pl-3">
              {current.report.validation_reason}
            </p>
          )}
        </Card>

        <Card title="Issues Found" icon={<AlertTriangle className="w-4 h-4 text-yellow-500" />}>
          {current.report.issues_found.length === 0 ? (
            <p className="text-xs text-slate-500 italic mt-2">No issues raised by the validator.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {current.report.issues_found.map((iss, i) => (
                <li key={i} className="text-xs text-slate-300 leading-relaxed flex gap-2">
                  <span className="text-yellow-500 shrink-0">•</span>
                  <span>{iss}</span>
                </li>
              ))}
            </ul>
          )}
          {current.report.revision_instruction && (
            <div className="mt-4 p-3 bg-slate-900 border border-slate-800 rounded text-xs text-slate-400">
              <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">Revision instruction</p>
              <p>{current.report.revision_instruction}</p>
            </div>
          )}
        </Card>
      </div>

      <Card className="p-0 overflow-hidden bg-slate-950/50 border-slate-800 shadow-2xl">
        <div className="p-5 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/10 rounded border border-blue-500/20">
              <Activity className="text-blue-500 w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Agent DAG</span>
              <span className="text-xs font-bold text-slate-300">classify → severity_router → … → report</span>
            </div>
          </div>
        </div>
        <div className="p-8 bg-black/20">
          <AgentWorkflowGraph nodes={workflow.nodes} report={current.report} />
        </div>
      </Card>

      <Card title="Execution Trace" icon={<Terminal className="w-4 h-4 text-blue-500" />}>
        {summary.executionPath.length === 0 ? (
          <p className="text-xs text-slate-500 italic mt-2">No trace recorded.</p>
        ) : (
          <div className="flex flex-wrap items-center gap-2 mt-2 font-mono text-xs">
            {summary.executionPath.map((step, i) => (
              <span key={`${step}-${i}`} className="flex items-center gap-2">
                <span className="px-2 py-1 rounded border border-slate-800 bg-slate-900 text-slate-200">{step}</span>
                {i < summary.executionPath.length - 1 && <span className="text-slate-600">→</span>}
              </span>
            ))}
          </div>
        )}
      </Card>

      {current.report.report_md && (
        <Card title="Final Report" icon={<Zap className="w-4 h-4 text-blue-500" />}>
          <pre className="text-xs text-slate-300 whitespace-pre-wrap mt-2 font-mono leading-relaxed">{current.report.report_md}</pre>
        </Card>
      )}
    </motion.div>
  );
}

function SummaryBadge({ label, value, className }: { label: string; value: string; className: string }) {
  return (
    <div className={cn('px-3 py-2 rounded-lg border', className)}>
      <div className="text-[9px] font-mono uppercase tracking-widest opacity-70">{label}</div>
      <div className="text-sm font-bold mt-0.5">{value}</div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className={cn('text-slate-200 text-right break-all', mono && 'font-mono text-xs')}>{value}</dd>
    </div>
  );
}
