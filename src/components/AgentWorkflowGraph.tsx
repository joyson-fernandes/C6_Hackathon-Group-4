import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  CheckCircle2, 
  Loader2, 
  XCircle, 
  Clock, 
  Database, 
  ChevronRight,
  ChevronDown,
  Terminal,
  Cpu
} from 'lucide-react';
import { AgentNode, AgentStatus } from '../types';
import { cn } from '../utils/cn';

interface AgentWorkflowGraphProps {
  nodes: AgentNode[];
}

export function AgentWorkflowGraph({ nodes }: AgentWorkflowGraphProps) {
  const [expandedNode, setExpandedNode] = useState<string | null>(null);

  return (
    <div className="relative w-full overflow-x-auto pb-8 pt-4">
      {/* Background Connector Line */}
      <div className="absolute top-[44px] left-0 right-0 h-[2px] bg-slate-800 z-0" />
      
      <div className="flex justify-between min-w-[1000px] px-8 relative z-10">
        {nodes.map((node, idx) => (
          <div key={node.id} className="flex flex-col items-center group w-40">
            {/* Status Node */}
            <StatusIcon 
              status={node.status} 
              isLast={idx === nodes.length - 1} 
              isExpanded={expandedNode === node.id}
              onClick={() => setExpandedNode(expandedNode === node.id ? null : node.id)}
            />

            {/* Label */}
            <div className="mt-4 text-center">
              <h4 className={cn(
                "text-[11px] font-bold uppercase tracking-wider transition-colors",
                node.status === 'running' ? "text-blue-400" :
                node.status === 'completed' ? "text-slate-200" : "text-slate-600"
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

            {/* Expandable Details Popper */}
            <AnimatePresence>
              {expandedNode === node.id && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-[120px] bg-slate-900 border border-slate-800 rounded-lg p-4 shadow-2xl z-50 w-64 text-left"
                >
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
                    <Terminal className="w-3 h-3 text-blue-500" />
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase">Agent Artifacts</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                    {node.description}
                  </p>
                  {node.output && (
                    <div className="bg-slate-950 p-2 rounded border border-slate-800 font-mono text-[10px] text-blue-400/80 max-h-32 overflow-y-auto scrollbar-hide">
                      <div className="flex items-center gap-1.5 mb-1 text-slate-600">
                        <Database className="w-2.5 h-2.5" /> 
                        <span>output_stream</span>
                      </div>
                      {node.output}
                    </div>
                  )}
                  {node.error && (
                    <div className="mt-2 text-red-500 text-[10px] font-mono flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> {node.error}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusIcon({ status, isExpanded, onClick }: { 
  status: AgentStatus; 
  isLast: boolean;
  isExpanded: boolean;
  onClick: () => void;
}) {
  const baseClasses = "w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all cursor-pointer relative z-20 hover:scale-105 active:scale-95 shadow-xl";
  
  const statusStyles = {
    pending: "bg-slate-950 border-slate-800 text-slate-700",
    running: "bg-blue-600/10 border-blue-500 text-blue-500 shadow-blue-500/20",
    completed: "bg-green-600/10 border-green-500 text-green-500 shadow-green-500/10",
    failed: "bg-red-600/10 border-red-500 text-red-500 shadow-red-500/20"
  };

  return (
    <div onClick={onClick} className={cn(baseClasses, statusStyles[status], isExpanded && "ring-4 ring-blue-500/20")}>
      {status === 'pending' && <Clock className="w-6 h-6 stroke-[1.5]" />}
      {status === 'running' && (
        <div className="relative">
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          >
            <Loader2 className="w-6 h-6 animate-spin" />
          </motion.div>
          <Zap className="w-3 h-3 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 fill-blue-500" />
        </div>
      )}
      {status === 'completed' && <CheckCircle2 className="w-6 h-6" />}
      {status === 'failed' && <XCircle className="w-6 h-6" />}
      
      <div className="absolute -bottom-1 -right-1 bg-slate-900 border border-slate-800 rounded-full p-1 shadow-md group-hover:bg-slate-800 transition-colors">
        <ChevronDown className={cn("w-3 h-3 text-slate-500 transition-transform", isExpanded && "rotate-180")} />
      </div>
    </div>
  );
}
