import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Terminal, 
  ArrowUpRight, 
  Activity, 
  Cpu, 
  Clock, 
  History,
  Shield,
  List as PlayList,
  Loader2
} from 'lucide-react';
import { useLiveWorkflow } from '../hooks/useIncidents';
import { cn } from '../utils/cn';
import { Card } from '../components/ui/Card';
import { AgentWorkflowGraph } from '../components/AgentWorkflowGraph';

export function WorkflowView() {
  const { workflow, loading } = useLiveWorkflow('INC-2026-001');

  if (loading || !workflow) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Hydrating Agent Context...</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Header with breadcrumbs and primary stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-slate-900/40 p-6 border border-slate-800 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono font-bold text-blue-500 uppercase tracking-[0.2em] bg-blue-500/10 px-2 py-0.5 rounded">Orchestrator v4.2</span>
            <span className="text-slate-600">/</span>
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-[0.2em]">{workflow.id}</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter">Multi-Agent Workflow</h1>
          <p className="text-slate-400 mt-1 max-w-xl text-sm">Autonomous orchestration of AI agents across distributed infrastructure logs and recovery cookbooks.</p>
        </div>
        
        <div className="flex gap-4">
           <div className="text-right">
              <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Active Execution</div>
              <div className="text-lg font-bold text-white flex items-center justify-end gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                {workflow.incidentId}
              </div>
           </div>
           <div className="w-px h-10 bg-slate-800 self-center" />
           <div className="text-right">
              <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Total Latency</div>
              <div className="text-lg font-bold text-white">6.5s</div>
           </div>
        </div>
      </div>

      {/* Primary Workflow Visualization */}
      <Card className="p-0 overflow-hidden bg-slate-950/50 border-slate-800 shadow-2xl">
         <div className="p-5 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600/10 rounded border border-blue-500/20">
                <Activity className="text-blue-500 w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">Operational Pipeline</span>
                <span className="text-xs font-bold text-slate-300">In-Flight Agent Sequence</span>
              </div>
            </div>
            <div className="flex gap-2">
               <button className="px-3 py-1 bg-slate-950 border border-slate-800 rounded text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-white transition-colors">
                 Inspect Graphs
               </button>
            </div>
         </div>
         
         <div className="p-8 bg-black/20">
            <AgentWorkflowGraph nodes={workflow.nodes} />
         </div>

         <div className="p-4 bg-slate-900/20 border-t border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4">
            <WorkflowStat icon={Cpu} label="Compute Usage" value="0.45 vCPU" />
            <WorkflowStat icon={History} label="Memory Reservation" value="128MB" />
            <WorkflowStat icon={Zap} label="Token Burn" value="~1.9k" />
            <WorkflowStat icon={Shield} label="Safety Rating" value="A+" color="text-green-500" />
         </div>
      </Card>

      {/* Secondary Content: Logs and Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <Card className="p-0 overflow-hidden border-slate-800">
              <div className="p-4 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <Terminal className="text-blue-500 w-4 h-4" />
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Global Agent Audit Log</span>
                 </div>
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
              </div>
              <div className="p-0">
                {workflow.nodes.filter(n => n.status !== 'pending').map((node, idx) => (
                  <div key={node.id} className="p-4 border-b border-slate-800/50 hover:bg-slate-900/20 transition-colors flex gap-4">
                     <div className="text-[10px] font-mono text-slate-600 w-12 pt-1">{node.duration || '0s'}</div>
                     <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                           <h5 className="text-xs font-bold text-white uppercase tracking-tighter">{node.name}</h5>
                           <span className={cn(
                             "text-[9px] font-black px-1.5 py-0.5 rounded uppercase border",
                             node.status === 'completed' ? "bg-green-500/10 border-green-500/20 text-green-500" :
                             node.status === 'running' ? "bg-blue-500/10 border-blue-500/20 text-blue-500" : "text-slate-600"
                           )}>
                             {node.status}
                           </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono italic">"{node.output || node.description}"</p>
                     </div>
                  </div>
                ))}
              </div>
           </Card>
        </div>

        <div className="space-y-6">
           <Card title="Historical Reliability" className="p-6">
              <div className="space-y-4 pt-4">
                 <ReliabilityMetric label="Auth Service" score={99.4} />
                 <ReliabilityMetric label="Payment Gateway" score={98.2} />
                 <ReliabilityMetric label="Internal DNS" score={94.1} />
              </div>
              <p className="mt-6 text-[10px] text-slate-600 leading-relaxed font-mono uppercase tracking-tighter">
                Last 30 days of agentic mitigation success rates.
              </p>
           </Card>

           <Card className="p-6 bg-blue-600/5 border-blue-500/20 overflow-hidden relative group">
              <div className="absolute top-0 right-0 -mr-4 -mt-4 p-8 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
              <div className="relative z-10">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  Auto-Pilot Performance
                </h4>
                <div className="mt-4 flex items-end gap-1 h-12">
                   {[40, 70, 45, 90, 65, 80, 50, 95].map((h, i) => (
                     <div key={i} className="flex-1 bg-blue-500/30 rounded-t" style={{ height: `${h}%` }} />
                   ))}
                </div>
                <div className="mt-2 flex justify-between text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                   <span>Throughput</span>
                   <span>+12.4%</span>
                </div>
              </div>
           </Card>
        </div>
      </div>
    </motion.div>
  );
}

function WorkflowStat({ icon: Icon, label, value, color }: any) {
  return (
    <div className="flex items-center gap-3">
       <Icon className="w-3.5 h-3.5 text-slate-600" />
       <div>
         <div className="text-[9px] font-mono font-bold text-slate-600 uppercase tracking-widest leading-none mb-1">{label}</div>
         <div className={cn("text-xs font-bold text-slate-400", color)}>{value}</div>
       </div>
    </div>
  );
}

function ReliabilityMetric({ label, score }: { label: string; score: number }) {
  return (
     <div className="space-y-1.5">
        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
           <span>{label}</span>
           <span>{score}%</span>
        </div>
        <div className="w-full h-1 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
           <motion.div 
             initial={{ width: 0 }}
             animate={{ width: `${score}%` }}
             className={cn(
               "h-full rounded-full transition-colors",
               score > 98 ? "bg-green-500/50" : score > 95 ? "bg-blue-500/50" : "bg-yellow-500/50"
             )}
           />
        </div>
     </div>
  );
}
