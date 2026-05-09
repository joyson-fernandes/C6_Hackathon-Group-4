import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Terminal,
  Clock,
  Activity,
  ShieldCheck,
  Signal,
  Inbox,
} from 'lucide-react';
import { useIntegrations } from '../hooks/useIncidents';
import { cn } from '../utils/cn';
import { Card } from '../components/ui/Card';
import { IntegrationStatus } from '../types';

export function IntegrationsView() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { integrations } = useIntegrations();

  const healthy = integrations.filter(i => i.status === 'healthy').length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Integrations</h1>
          <p className="text-slate-400 mt-1 max-w-xl">Pipeline-side delivery status from the latest analysis run.</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg flex items-center gap-3">
          <ShieldCheck className="w-4 h-4 text-green-500" />
          <div>
            <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest leading-none">Health</div>
            <div className="text-xs font-bold text-white mt-1">{healthy}/{integrations.length || '—'} healthy</div>
          </div>
        </div>
      </div>

      <Card className="p-0 overflow-hidden bg-slate-950/20 border-slate-800">
        <div className="p-4 bg-slate-900/50 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Signal className="w-4 h-4 text-blue-500" />
            <h3 className="text-xs font-black text-white uppercase tracking-widest">Connectivity Matrix</h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">FROM_LATEST_RUN</span>
        </div>

        {integrations.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center gap-3">
            <Inbox className="w-8 h-8 text-slate-600" />
            <p className="text-sm text-slate-400">No integration data yet</p>
            <p className="text-xs text-slate-600 font-mono uppercase tracking-widest">Run an analysis to populate</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {integrations.map((integration) => (
              <IntegrationRow
                key={integration.id}
                integration={integration}
                isExpanded={expandedId === integration.id}
                onToggle={() => setExpandedId(expandedId === integration.id ? null : integration.id)}
              />
            ))}
          </div>
        )}
      </Card>

      <div className="space-y-4">
        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
          <Terminal className="w-4 h-4 text-blue-500" />
          Notes
        </h3>
        <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-6 text-xs text-slate-400 leading-relaxed space-y-2">
          <p><strong className="text-slate-200">Slack</strong> &amp; <strong className="text-slate-200">JIRA</strong> notifiers are stubs in <code className="font-mono text-slate-300">agents/notifier.py</code>. Implement them to mark these integrations healthy on next run.</p>
          <p><strong className="text-slate-200">Knowledge Base</strong> is BM25 over <code className="font-mono text-slate-300">knowledge_base/*.md</code>. Confidence reflects whether the latest run found relevant runbooks.</p>
        </div>
      </div>
    </motion.div>
  );
}

function IntegrationRow({ integration, isExpanded, onToggle }: {
  integration: IntegrationStatus;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={cn('group transition-all', isExpanded ? 'bg-slate-900/40' : 'hover:bg-slate-900/20')}>
      <div onClick={onToggle} className="p-5 flex items-center gap-6 cursor-pointer">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center border transition-all',
          integration.status === 'healthy' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
            integration.status === 'degraded' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
              'bg-red-500/10 border-red-500/20 text-red-500'
        )}>
          <Zap className="w-5 h-5" />
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h4 className="text-sm font-bold text-white uppercase tracking-tight">{integration.name}</h4>
            <span className="text-[9px] font-mono font-bold text-slate-500 border border-slate-800 px-1.5 py-0.5 rounded bg-slate-950 uppercase">{integration.type}</span>
          </div>
          <div className="flex gap-4">
            <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3" /> {integration.latency}
            </span>
            <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
              <Activity className="w-3 h-3" /> {integration.uptime}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={cn(
            'text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest border',
            integration.status === 'healthy' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
              integration.status === 'degraded' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500' :
                'bg-red-500/20 border-red-500/30 text-red-500'
          )}>
            {integration.status}
          </div>
          <ChevronDown className={cn('w-4 h-4 text-slate-600 transition-transform', isExpanded && 'rotate-180')} />
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-800/50"
          >
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h5 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Last Execution</h5>
                <div className="space-y-3">
                  <ExecutionMetric label="Response" value={integration.lastExecution.response || 'N/A'} success={integration.lastExecution.status === 'success'} />
                </div>
              </div>
              <div className="space-y-4">
                <h5 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Status</h5>
                <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Last Result</span>
                    <div className="flex items-center gap-2">
                      {integration.lastExecution.status === 'success' ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
                      <span className={cn('text-[10px] font-bold uppercase', integration.lastExecution.status === 'success' ? 'text-green-500' : 'text-red-500')}>
                        {integration.lastExecution.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Timestamp</span>
                    <span className="text-[10px] font-mono text-slate-400">{new Date(integration.lastExecution.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ExecutionMetric({ label, value, success }: { label: string; value: string; success?: boolean }) {
  return (
    <div>
      <div className="text-[9px] font-mono font-bold text-slate-600 uppercase tracking-widest mb-1">{label}</div>
      <div className={cn(
        'p-3 rounded-lg border text-[10px] font-mono bg-slate-950 border-slate-800 text-slate-400 whitespace-pre-wrap max-h-32 overflow-y-auto',
        success === false && 'border-red-900/50 text-red-400'
      )}>
        {value}
      </div>
    </div>
  );
}
