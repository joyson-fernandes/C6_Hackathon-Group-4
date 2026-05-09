import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  CheckCircle2,
  Loader2,
  XCircle,
  Clock,
  Terminal,
  ChevronDown,
  X,
  AlertTriangle,
  ShieldCheck,
  GitBranch,
  BookOpen,
  Inbox,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { AgentNode, AgentStatus, AnalysisReport, BackendSeverity } from '../types';
import { cn } from '../utils/cn';

interface AgentWorkflowGraphProps {
  nodes: AgentNode[];
  report?: AnalysisReport;
}

export function AgentWorkflowGraph({ nodes, report }: AgentWorkflowGraphProps) {
  const [expandedNodeId, setExpandedNodeId] = useState<string | null>(null);
  const expandedNode = nodes.find(n => n.id === expandedNodeId) ?? null;

  // Close modal on Escape
  useEffect(() => {
    if (!expandedNodeId) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setExpandedNodeId(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expandedNodeId]);

  return (
    <>
      <div className="relative w-full overflow-x-auto pb-8 pt-4">
        <div className="absolute top-[44px] left-0 right-0 h-[2px] bg-slate-800 z-0" />

        <div className="flex justify-between min-w-[1000px] px-8 relative z-10">
          {nodes.map((node) => (
            <div key={node.id} className="flex flex-col items-center group w-40">
              <StatusIcon
                status={node.status}
                isExpanded={expandedNodeId === node.id}
                onClick={() => setExpandedNodeId(expandedNodeId === node.id ? null : node.id)}
              />
              <div className="mt-4 text-center">
                <h4 className={cn(
                  'text-[11px] font-bold uppercase tracking-wider transition-colors',
                  node.status === 'running' ? 'text-blue-400' :
                  node.status === 'completed' ? 'text-slate-200' : 'text-slate-600'
                )}>
                  {node.name}
                </h4>
                <div className="mt-1 flex items-center justify-center gap-2">
                  {node.duration && (
                    <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1 border border-slate-800 rounded">
                      {node.duration}
                    </span>
                  )}
                  {node.tokens && (
                    <span className="text-[9px] font-mono text-blue-500/70">
                      {node.tokens} tkn
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {expandedNode && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start md:items-center justify-center p-4 overflow-y-auto"
            onClick={() => setExpandedNodeId(null)}
          >
            <motion.div
              key="modal"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <ModalHeader node={expandedNode} onClose={() => setExpandedNodeId(null)} />
              <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
                <p className="text-sm text-slate-300 leading-relaxed">{expandedNode.description}</p>
                {expandedNode.output && (
                  <p className="text-xs font-mono text-slate-400 italic border-l-2 border-slate-800 pl-3">
                    {expandedNode.output}
                  </p>
                )}
                {report && <NodeDetail nodeId={expandedNode.id} report={report} />}
                {expandedNode.error && (
                  <div className="text-xs text-red-400 font-mono flex items-center gap-2 bg-red-950/20 border border-red-900/50 rounded-lg p-3">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>{expandedNode.error}</span>
                  </div>
                )}
                {expandedNode.status === 'pending' && (
                  <div className="text-xs text-slate-500 italic flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    This node was not visited in the latest run.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function ModalHeader({ node, onClose }: { node: AgentNode; onClose: () => void }) {
  const statusStyles = {
    pending: 'bg-slate-800 text-slate-500 border-slate-700',
    running: 'bg-blue-600/20 text-blue-400 border-blue-500/40',
    completed: 'bg-green-600/20 text-green-400 border-green-500/40',
    failed: 'bg-red-600/20 text-red-400 border-red-500/40',
  };
  return (
    <div className="flex items-center justify-between gap-4 p-5 border-b border-slate-800 bg-slate-900/40">
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center border-2', statusStyles[node.status])}>
          {node.status === 'pending' && <Clock className="w-5 h-5" />}
          {node.status === 'running' && <Loader2 className="w-5 h-5 animate-spin" />}
          {node.status === 'completed' && <CheckCircle2 className="w-5 h-5" />}
          {node.status === 'failed' && <XCircle className="w-5 h-5" />}
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{node.id}</div>
          <h2 className="text-lg font-bold text-white truncate">{node.name}</h2>
        </div>
      </div>
      <button
        onClick={onClose}
        aria-label="Close"
        className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}

const SEVERITY_COLOR: Record<BackendSeverity, string> = {
  critical: 'bg-red-500/10 text-red-400 border-red-500/30',
  high: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  warn: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
};

function NodeDetail({ nodeId, report }: { nodeId: string; report: AnalysisReport }) {
  switch (nodeId) {
    case 'classify':
      return <ClassifyDetail report={report} />;
    case 'severity_router':
      return <SeverityRouterDetail report={report} />;
    case 'deep_analysis':
      return <DeepAnalysisDetail report={report} />;
    case 'rag_retriever':
      return <RagDetail report={report} />;
    case 'remediate':
      return <RemediateDetail report={report} />;
    case 'validator':
      return <ValidatorDetail report={report} />;
    case 'cookbook':
      return <CookbookDetail report={report} />;
    case 'summary_report':
      return <SummaryReportDetail report={report} />;
    case 'human_approval':
      return <HumanApprovalDetail report={report} />;
    case 'slack':
      return <SlackDetail report={report} />;
    case 'jira':
      return <JiraDetail report={report} />;
    case 'report':
      return <ReportDetail report={report} />;
    default:
      return null;
  }
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
        {icon}
        <span>{title}</span>
      </div>
      {children}
    </section>
  );
}

function ClassifyDetail({ report }: { report: AnalysisReport }) {
  if (report.incidents.length === 0) {
    return <p className="text-sm text-slate-500 italic">No incidents extracted.</p>;
  }
  return (
    <Section title={`${report.incidents.length} incident${report.incidents.length === 1 ? '' : 's'} extracted`} icon={<Inbox className="w-3.5 h-3.5" />}>
      <div className="space-y-3">
        {report.incidents.map(inc => (
          <div key={inc.id} className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-500">{inc.id}</span>
                <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold border uppercase', SEVERITY_COLOR[inc.severity])}>
                  {inc.severity}
                </span>
                <span className="text-xs text-slate-400">{inc.service}</span>
              </div>
              <span className="text-xs font-bold text-white">{inc.error_type}</span>
            </div>
            <p className="text-sm text-slate-300">{inc.summary}</p>
            {inc.evidence && (
              <details className="mt-2">
                <summary className="text-[10px] font-mono text-slate-500 uppercase cursor-pointer hover:text-slate-300">Evidence</summary>
                <pre className="mt-2 p-2 bg-slate-950 border border-slate-800 rounded text-[10px] text-slate-400 overflow-x-auto whitespace-pre-wrap">{inc.evidence}</pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

function SeverityRouterDetail({ report }: { report: AnalysisReport }) {
  const flags = report.flags;
  return (
    <div className="space-y-5">
      <Section title="Routing decision" icon={<GitBranch className="w-3.5 h-3.5" />}>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <Field label="Aggregate severity" value={report.severity ?? '—'} />
          <Field label="Incident type" value={report.incident_type ?? '—'} mono />
          <Field label="Routing path" value={report.routing_path ?? '—'} mono span2 />
        </dl>
        {report.routing_reason && (
          <p className="text-xs text-slate-400 italic border-l-2 border-slate-800 pl-3 mt-2">{report.routing_reason}</p>
        )}
      </Section>
      <Section title="Flags raised">
        <div className="flex flex-wrap gap-2">
          {Object.entries(flags).map(([k, v]) => (
            <span key={k} className={cn(
              'px-2 py-0.5 text-[10px] font-mono rounded border',
              v ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'
            )}>
              {k.replace('requires_', '')}{v ? ' ✓' : ''}
            </span>
          ))}
        </div>
      </Section>
    </div>
  );
}

function DeepAnalysisDetail({ report }: { report: AnalysisReport }) {
  return (
    <div className="space-y-3">
      {report.flags.requires_deep_analysis ? (
        <p className="text-sm text-slate-300">
          Triggered because aggregate severity is <span className="font-bold">{report.severity}</span>. The deep_analysis node ran extra correlation/dependency analysis before handing off to RAG.
        </p>
      ) : (
        <p className="text-sm text-slate-500 italic">
          Skipped — severity <span className="font-mono">{report.severity ?? '—'}</span> didn't require deep analysis.
        </p>
      )}
    </div>
  );
}

function RagDetail({ report }: { report: AnalysisReport }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 text-xs">
        <Field label="Snippets" value={String(report.rag_snippet_count)} />
        <Field label="Confidence" value={report.rag_confidence} />
        <Field label="Sources" value={String(report.rag_sources.length)} />
      </div>
      {report.rag_sources.length > 0 ? (
        <Section title="Runbook sources cited" icon={<BookOpen className="w-3.5 h-3.5" />}>
          <ul className="space-y-1 font-mono text-xs text-slate-300">
            {report.rag_sources.map(s => (
              <li key={s} className="flex items-center gap-2 px-2 py-1 bg-slate-900/50 border border-slate-800 rounded">
                <BookOpen className="w-3 h-3 text-blue-500" />
                {s}
              </li>
            ))}
          </ul>
        </Section>
      ) : (
        <p className="text-xs text-slate-500 italic">No runbook snippets matched the logs.</p>
      )}
    </div>
  );
}

function RemediateDetail({ report }: { report: AnalysisReport }) {
  const fixes = Object.values(report.remediations);
  if (fixes.length === 0) return <p className="text-sm text-slate-500 italic">No fixes generated.</p>;
  return (
    <Section title={`${fixes.length} fix${fixes.length === 1 ? '' : 'es'} generated`}>
      <div className="space-y-4">
        {fixes.map(fix => (
          <div key={fix.incident_id} className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <span className="text-[10px] font-mono text-slate-500">{fix.incident_id}</span>
              <span className={cn(
                'px-2 py-0.5 rounded text-[10px] font-bold border uppercase',
                fix.risk === 'high' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                fix.risk === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                'bg-green-500/10 text-green-400 border-green-500/30'
              )}>
                {fix.risk} risk
              </span>
            </div>
            <p className="text-sm text-slate-300 italic mb-3">{fix.rationale}</p>
            {fix.steps.length > 0 && (
              <ol className="space-y-2 list-decimal list-inside text-sm text-slate-200">
                {fix.steps.map((s, i) => (<li key={i}>{s}</li>))}
              </ol>
            )}
            {fix.runbook_ref && (
              <p className="text-[10px] font-mono text-slate-500 mt-3">runbook: {fix.runbook_ref}</p>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

function ValidatorDetail({ report }: { report: AnalysisReport }) {
  const score = report.quality_score ?? 0;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3 text-xs">
        <Field label="Status" value={report.validator_status ?? '—'} />
        <Field label="Quality" value={report.quality_score != null ? `${report.quality_score}/10` : '—'} />
        <Field label="Retries" value={String(report.retry_count)} />
      </div>
      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={cn(
          'h-full',
          score >= 7 ? 'bg-green-500' : score >= 5 ? 'bg-yellow-500' : 'bg-red-500'
        )} style={{ width: `${(score / 10) * 100}%` }} />
      </div>
      {report.validation_reason && (
        <p className="text-sm text-slate-300 italic border-l-2 border-slate-800 pl-3">{report.validation_reason}</p>
      )}
      {report.issues_found.length > 0 && (
        <Section title="Issues found" icon={<AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />}>
          <ul className="space-y-1.5">
            {report.issues_found.map((iss, i) => (
              <li key={i} className="text-sm text-slate-300 flex gap-2">
                <span className="text-yellow-500 shrink-0">•</span>
                <span>{iss}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
      {report.revision_instruction && (
        <Section title="Revision instruction">
          <p className="text-sm text-slate-300 bg-slate-900 border border-slate-800 rounded-lg p-3">
            {report.revision_instruction}
          </p>
        </Section>
      )}
    </div>
  );
}

function CookbookDetail({ report }: { report: AnalysisReport }) {
  const cb = report.cookbook;
  if (!cb || cb.items.length === 0) return <p className="text-sm text-slate-500 italic">No checklist produced.</p>;
  return (
    <Section title={cb.title} icon={<ShieldCheck className="w-3.5 h-3.5" />}>
      <ol className="space-y-2 list-decimal list-inside text-sm text-slate-200">
        {cb.items.map((item, i) => (<li key={i}>{item}</li>))}
      </ol>
    </Section>
  );
}

function SummaryReportDetail({ report }: { report: AnalysisReport }) {
  return (
    <p className="text-sm text-slate-400 italic">
      {report.severity === 'info'
        ? 'Used for info-only logs — bypasses remediation entirely.'
        : `Bypassed for ${report.severity ?? '—'} severity (only used when severity = info).`}
    </p>
  );
}

function HumanApprovalDetail({ report }: { report: AnalysisReport }) {
  return (
    <div className="grid grid-cols-2 gap-3 text-xs">
      <Field label="Approval status" value={report.human_approval_status ?? '—'} />
      <Field label="Escalation" value={report.escalation_required ? 'required' : 'not required'} />
    </div>
  );
}

function SlackDetail({ report }: { report: AnalysisReport }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-xs">
        <Field label="Status" value={report.slack_status ?? 'skipped'} />
        <Field label="Thread ts" value={report.slack_thread_ts ?? '—'} mono />
      </div>
      {report.slack_message_preview && (
        <Section title="Message preview" icon={<Terminal className="w-3.5 h-3.5" />}>
          <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono bg-slate-900 border border-slate-800 rounded-lg p-3 max-h-64 overflow-y-auto">
            {report.slack_message_preview}
          </pre>
        </Section>
      )}
    </div>
  );
}

function JiraDetail({ report }: { report: AnalysisReport }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-xs">
        <Field label="Status" value={report.jira_status ?? 'skipped'} />
        <Field label="Tickets" value={String(report.jira_keys.length)} />
      </div>
      {report.jira_keys.length > 0 && (
        <Section title="Keys filed">
          <ul className="space-y-1 font-mono text-xs text-slate-300">
            {report.jira_keys.map(k => (
              <li key={k} className="px-2 py-1 bg-slate-900/50 border border-slate-800 rounded">{k}</li>
            ))}
          </ul>
        </Section>
      )}
      {report.jira_summary && (
        <Section title="Summary">
          <p className="text-sm text-slate-300">{report.jira_summary}</p>
        </Section>
      )}
    </div>
  );
}

function ReportDetail({ report }: { report: AnalysisReport }) {
  if (!report.report_md) return <p className="text-sm text-slate-500 italic">No report body.</p>;
  return (
    <Section title="Final markdown report">
      <div className="prose prose-invert prose-sm max-w-none bg-slate-900 border border-slate-800 rounded-lg p-4 max-h-[40vh] overflow-y-auto">
        <ReactMarkdown>{report.report_md}</ReactMarkdown>
      </div>
    </Section>
  );
}

function Field({ label, value, mono, span2 }: { label: string; value: string; mono?: boolean; span2?: boolean }) {
  return (
    <div className={cn(span2 && 'md:col-span-2')}>
      <dt className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">{label}</dt>
      <dd className={cn(
        'bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-200 break-all',
        mono ? 'font-mono text-[11px]' : 'text-xs'
      )}>{value}</dd>
    </div>
  );
}

function StatusIcon({ status, isExpanded, onClick }: {
  status: AgentStatus;
  isExpanded: boolean;
  onClick: () => void;
}) {
  const baseClasses = 'w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all cursor-pointer relative z-20 hover:scale-105 active:scale-95 shadow-xl';
  const statusStyles = {
    pending: 'bg-slate-950 border-slate-800 text-slate-700',
    running: 'bg-blue-600/10 border-blue-500 text-blue-500 shadow-blue-500/20',
    completed: 'bg-green-600/10 border-green-500 text-green-500 shadow-green-500/10',
    failed: 'bg-red-600/10 border-red-500 text-red-500 shadow-red-500/20',
  };
  return (
    <div onClick={onClick} className={cn(baseClasses, statusStyles[status], isExpanded && 'ring-4 ring-blue-500/20')}>
      {status === 'pending' && <Clock className="w-6 h-6 stroke-[1.5]" />}
      {status === 'running' && (
        <div className="relative">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}>
            <Loader2 className="w-6 h-6 animate-spin" />
          </motion.div>
          <Zap className="w-3 h-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 fill-blue-500" />
        </div>
      )}
      {status === 'completed' && <CheckCircle2 className="w-6 h-6" />}
      {status === 'failed' && <XCircle className="w-6 h-6" />}
      <div className="absolute -bottom-1 -right-1 bg-slate-900 border border-slate-800 rounded-full p-1 shadow-md group-hover:bg-slate-800 transition-colors">
        <ChevronDown className={cn('w-3 h-3 text-slate-500 transition-transform', isExpanded && 'rotate-180')} />
      </div>
    </div>
  );
}
