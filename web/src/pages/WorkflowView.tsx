import { motion } from 'motion/react';
import { Zap, Terminal, Activity, Inbox } from 'lucide-react';
import { useAnalysisStore } from '../store/AnalysisStore';
import { toWorkflowExecution } from '../utils/adapt';
import { cn } from '../utils/cn';
import { Card } from '../components/ui/Card';
import { AgentWorkflowGraph } from '../components/AgentWorkflowGraph';

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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-slate-900/40 p-6 border border-slate-800 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono font-bold text-blue-500 uppercase tracking-[0.2em] bg-blue-500/10 px-2 py-0.5 rounded">LangGraph Pipeline</span>
            <span className="text-slate-600">/</span>
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">{workflow.id}</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter">Multi-Agent Workflow</h1>
          <p className="text-slate-400 mt-1 max-w-xl text-sm">Last completed run for {workflow.incidentId}.</p>
        </div>

        <div className="flex gap-4">
          <div className="text-right">
            <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Source File</div>
            <div className="text-sm font-bold text-white flex items-center justify-end gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              {current.fileName ?? 'pasted logs'}
            </div>
          </div>
          <div className="w-px h-10 bg-slate-800 self-center" />
          <div className="text-right">
            <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Incidents</div>
            <div className="text-lg font-bold text-white">{current.report.incidents.length}</div>
          </div>
        </div>
      </div>

      <Card className="p-0 overflow-hidden bg-slate-950/50 border-slate-800 shadow-2xl">
        <div className="p-5 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/10 rounded border border-blue-500/20">
              <Activity className="text-blue-500 w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Agent DAG</span>
              <span className="text-xs font-bold text-slate-300">classify → remediate → cookbook → slack/jira → report</span>
            </div>
          </div>
        </div>
        <div className="p-8 bg-black/20">
          <AgentWorkflowGraph nodes={workflow.nodes} />
        </div>
      </Card>

      <Card className="p-0 overflow-hidden border-slate-800">
        <div className="p-4 bg-slate-900/50 border-b border-slate-800 flex items-center gap-2">
          <Terminal className="text-blue-500 w-4 h-4" />
          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Agent Audit Log</span>
        </div>
        <div className="p-0">
          {workflow.nodes.map((node) => (
            <div key={node.id} className="p-4 border-b border-slate-800/50 hover:bg-slate-900/20 transition-colors flex gap-4">
              <div className="text-[10px] font-mono text-slate-600 w-12 pt-1">—</div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <h5 className="text-xs font-bold text-white uppercase tracking-tighter">{node.name}</h5>
                  <span className={cn(
                    'text-[9px] font-black px-1.5 py-0.5 rounded uppercase border',
                    node.status === 'completed' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
                      node.status === 'running' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' :
                        'bg-slate-700/20 border-slate-700/40 text-slate-500'
                  )}>
                    {node.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono italic">{node.output ?? node.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {current.report.report_md && (
        <Card title="Final Report" icon={<Zap className="w-4 h-4 text-blue-500" />}>
          <pre className="text-xs text-slate-300 whitespace-pre-wrap mt-2 font-mono leading-relaxed">{current.report.report_md}</pre>
        </Card>
      )}
    </motion.div>
  );
}
