import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'motion/react';
import { 
  CheckSquare, 
  Square, 
  Clock, 
  Terminal, 
  ShieldCheck, 
  History, 
  Download, 
  ExternalLink,
  ChevronRight,
  AlertCircle,
  FileCode,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { AnalysisResult } from '../types';
import { cn } from '../utils/cn';
import { Button } from './ui/Button';

interface CookbookPanelProps {
  analysis: AnalysisResult;
}

export function CookbookPanel({ analysis }: CookbookPanelProps) {
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  const toggleStep = (idx: number) => {
    setCompletedSteps(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const steps = analysis.remediationSteps;
  const progress = (Object.values(completedSteps).filter(Boolean).length / steps.length) * 100;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Cookbook Header Stats */}
      <div className="flex border border-slate-800 bg-slate-900/50 rounded-xl divide-x divide-slate-800 overflow-hidden">
        <div className="flex-1 p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Est. Duration</div>
            <div className="text-xs font-bold text-white">{analysis.estimatedTime || '15m'}</div>
          </div>
        </div>
        <div className="flex-1 p-4 flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Reliability</div>
            <div className="text-xs font-bold text-white">99.8% Success Rate</div>
          </div>
        </div>
        <div className="flex-1 p-4 flex items-center gap-3">
          <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Command Set</div>
            <div className="text-xs font-bold text-white">{steps.length} Actions</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Remediation Checklist */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-blue-500" />
                Remediation Sequence
              </h3>
              <div className="flex items-center gap-4">
                <div className="text-[10px] font-mono text-slate-500">
                  {Object.values(completedSteps).filter(Boolean).length} / {steps.length} COMPLETE
                </div>
                <div className="w-24 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div 
                  key={idx}
                  onClick={() => toggleStep(idx)}
                  className={cn(
                    "p-4 rounded-xl border transition-all cursor-pointer group",
                    completedSteps[idx] 
                      ? "bg-slate-900/30 border-green-500/20 opacity-60" 
                      : "bg-slate-900/50 border-slate-800 hover:border-slate-700 shadow-sm"
                  )}
                >
                  <div className="flex gap-4">
                    <button className={cn(
                      "w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors",
                      completedSteps[idx] ? "bg-green-500 text-slate-950" : "bg-slate-950 border border-slate-800 text-slate-700 group-hover:border-slate-600"
                    )}>
                      {completedSteps[idx] ? <ShieldCheck className="w-3 h-3" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />}
                    </button>
                    <div className="flex-1">
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown>{step}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recovery Validation */}
          {analysis.validationSteps && analysis.validationSteps.length > 0 && (
            <div className="p-6 bg-green-500/5 border border-green-500/20 rounded-2xl">
               <h3 className="text-sm font-black text-green-500 uppercase tracking-tight flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4" />
                Post-Recovery Validation
              </h3>
              <div className="space-y-3">
                {analysis.validationSteps.map((v, i) => (
                  <div key={i} className="flex gap-3 text-xs text-slate-400">
                    <ChevronRight className="w-3.5 h-3.5 text-green-500/50 shrink-0 mt-0.5" />
                    <span>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Rollback Strategy */}
          <div className="p-6 bg-red-600/5 border border-red-500/20 rounded-2xl">
            <h3 className="text-sm font-black text-red-500 uppercase tracking-tight flex items-center gap-2 mb-4">
              <History className="w-4 h-4" />
              Emergency Rollback
            </h3>
            <div className="space-y-4">
              {analysis.rollbackPlan && analysis.rollbackPlan.length > 0 ? (
                analysis.rollbackPlan.map((r, i) => (
                  <div key={i} className="text-xs text-slate-400 leading-relaxed pl-4 border-l border-red-900/50 italic">
                    "{r}"
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 italic">No specific rollback plan generated for this incident type.</div>
              )}
              <Button variant="outline" size="sm" className="w-full mt-2 border-red-900/50 text-red-400 hover:bg-red-500 hover:text-white">
                Initiate Rollback Seq.
              </Button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-4">Runbook Metadata</h4>
            <div className="space-y-4">
               <MetaRow label="Version" value="v1.4.2" />
               <MetaRow label="Author" value="Agent.Cookbook_v4" />
               <MetaRow label="Policy" value="Standard_SRE_v2" />
            </div>
            <div className="mt-8 space-y-2">
               <Button variant="outline" size="sm" className="w-full text-[10px] font-bold">
                  <Download className="w-3 h-3 mr-2" /> Export as PDF
               </Button>
               <Button variant="outline" size="sm" className="w-full text-[10px] font-bold">
                  <ExternalLink className="w-3 h-3 mr-2" /> Share with Team
               </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
     <div className="flex justify-between items-center text-xs">
        <span className="text-slate-500">{label}</span>
        <span className="text-slate-200 font-bold">{value}</span>
     </div>
  );
}
