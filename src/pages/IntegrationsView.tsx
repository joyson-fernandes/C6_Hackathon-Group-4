import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCcw, 
  Terminal, 
  Clock, 
  Activity, 
  ChevronRight,
  ChevronDown,
  Database,
  ExternalLink,
  ShieldCheck,
  Signal,
  Loader2
} from 'lucide-react';
import { useIntegrations } from '../hooks/useIncidents';
import { cn } from '../utils/cn';
import { Card } from '../components/ui/Card';
import { SeverityBadge as Badge } from '../components/ui/Badge';
import { IntegrationStatus } from '../types';

export function IntegrationsView() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { integrations, loading } = useIntegrations();

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Polling Connectivity Matrix...</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Integrations & Hooks</h1>
          <p className="text-slate-400 mt-1 max-w-xl">Real-time observability of external service delivery and automated response hooks.</p>
        </div>
        
        <div className="flex gap-4">
           <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg flex items-center gap-3">
              <ShieldCheck className="w-4 h-4 text-green-500" />
              <div>
                <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest leading-none">Security Key</div>
                <div className="text-xs font-bold text-white mt-1">ACTIVE_RSA_2048</div>
              </div>
           </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <StatusMetric label="Total Webhooks" value="24" icon={Zap} />
         <StatusMetric label="Avg Latency" value="142ms" icon={Clock} />
         <StatusMetric label="Success Rate" value="99.2%" icon={Activity} />
         <StatusMetric label="Delivery Retries" value="3 (Last 1h)" icon={RefreshCcw} color="text-yellow-500" />
      </div>

      {/* Integrations Table/List */}
      <Card className="p-0 overflow-hidden bg-slate-950/20 border-slate-800">
         <div className="p-4 bg-slate-900/50 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
               <Signal className="w-4 h-4 text-blue-500" />
               <h3 className="text-xs font-black text-white uppercase tracking-widest">Active Connectivity Matrix</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-500">REFRESH_INTERVAL: 5s</span>
         </div>
         
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
      </Card>
      
      {/* Recent Audit Log */}
      <div className="space-y-4">
         <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Terminal className="w-4 h-4 text-blue-500" />
            Global Execution Audit
         </h3>
         <div className="bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-900/50 text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">
                     <th className="px-6 py-3">Timestamp</th>
                     <th className="px-6 py-3">Integration</th>
                     <th className="px-6 py-3">Endpoint</th>
                     <th className="px-6 py-3">Status</th>
                     <th className="px-6 py-3 text-right">RTT</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-800/30">
                  <AuditRow time="22:34:11" name="Slack" endpoint="/api/chat.post" status="SUCCESS" rtt="12ms" />
                  <AuditRow time="22:33:45" name="JIRA" endpoint="/rest/api/3/issue" status="RETRY_2" rtt="2.4s" />
                  <AuditRow time="22:30:02" name="PagerDuty" endpoint="/v2/incidents" status="SUCCESS" rtt="42ms" />
                  <AuditRow time="22:25:59" name="Grafana" endpoint="/api/annotations" status="SUCCESS" rtt="18ms" />
               </tbody>
            </table>
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
    <div className={cn(
      "group transition-all",
      isExpanded ? "bg-slate-900/40" : "hover:bg-slate-900/20"
    )}>
      <div 
        onClick={onToggle}
        className="p-5 flex items-center gap-6 cursor-pointer"
      >
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center border transition-all",
          integration.status === 'healthy' ? "bg-green-500/10 border-green-500/20 text-green-500" :
          integration.status === 'degraded' ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500" : "bg-red-500/10 border-red-500/20 text-red-500"
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
                <Activity className="w-3 h-3" /> {integration.uptime} uptime
             </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
           <div className={cn(
             "text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest border",
             integration.status === 'healthy' ? "bg-green-500/10 border-green-500/20 text-green-500" :
             integration.status === 'degraded' ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500" : "bg-red-500/20 border-red-500/30 text-red-500"
           )}>
             {integration.status}
           </div>
           <ChevronDown className={cn("w-4 h-4 text-slate-600 transition-transform", isExpanded && "rotate-180")} />
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
                  <h5 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Last Execution Trace</h5>
                  <div className="space-y-3">
                     <ExecutionMetric label="Request Payload" value={integration.lastExecution.payload || 'N/A'} isCode />
                     <ExecutionMetric label="Response Body" value={integration.lastExecution.response || 'N/A'} isCode success={integration.lastExecution.status === 'success'} />
                  </div>
               </div>
               <div className="space-y-4">
                  <h5 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">Service Reliability</h5>
                  <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-4">
                     <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Retry Policy</span>
                        <span className="text-[10px] font-mono text-blue-500 font-bold">EXPONENTIAL_BACKOFF [3x]</span>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Last Result</span>
                        <div className="flex items-center gap-2">
                           {integration.lastExecution.status === 'success' ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
                           <span className={cn("text-[10px] font-bold uppercase", integration.lastExecution.status === 'success' ? "text-green-500" : "text-red-500")}>
                             {integration.lastExecution.status}
                           </span>
                        </div>
                     </div>
                     <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Timestamp</span>
                        <span className="text-[10px] font-mono text-slate-400">{new Date(integration.lastExecution.timestamp).toLocaleTimeString()}</span>
                     </div>
                  </div>
                  <button className="w-full py-2 bg-slate-900 border border-slate-800 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2">
                    <RefreshCcw className="w-3 h-3" /> FORCE_SYNCHRONIZATION
                  </button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ExecutionMetric({ label, value, isCode, success }: { label: string; value: string; isCode?: boolean; success?: boolean }) {
  return (
    <div>
      <div className="text-[9px] font-mono font-bold text-slate-600 uppercase tracking-widest mb-1">{label}</div>
      <div className={cn(
        "p-3 rounded-lg border text-[10px] font-mono",
        isCode ? "bg-slate-950 border-slate-800 text-slate-400 whitespace-pre-wrap max-h-32 overflow-y-auto scrollbar-hide" : "bg-slate-900 border-slate-800 text-slate-200",
        success === false && "border-red-900/50 text-red-400"
      )}>
        {value}
      </div>
    </div>
  );
}

function StatusMetric({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl flex items-center gap-4">
       <div className={cn("p-2 bg-slate-900 rounded-lg", color || "text-blue-500")}>
          <Icon className="w-4 h-4" />
       </div>
       <div>
          <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">{label}</div>
          <div className="text-lg font-bold text-white tracking-tight">{value}</div>
       </div>
    </div>
  );
}

function AuditRow({ time, name, endpoint, status, rtt }: any) {
  return (
    <tr className="group hover:bg-slate-800/10 transition-colors">
       <td className="px-6 py-4 text-[10px] font-mono text-slate-500">{time}</td>
       <td className="px-6 py-4">
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
             <span className="text-xs font-bold text-slate-200 uppercase">{name}</span>
          </div>
       </td>
       <td className="px-6 py-4 text-[10px] font-mono text-slate-600 group-hover:text-slate-400 transition-colors">{endpoint}</td>
       <td className="px-6 py-4">
          <span className={cn(
            "text-[9px] font-black px-1.5 py-0.5 rounded",
            status.includes('SUCCESS') ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
          )}>
            {status}
          </span>
       </td>
       <td className="px-6 py-4 text-right text-[10px] font-mono text-slate-500 font-bold">{rtt}</td>
    </tr>
  );
}
