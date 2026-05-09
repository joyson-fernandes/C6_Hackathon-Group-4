import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'motion/react';
import {
  CheckSquare,
  Clock,
  Terminal,
  ShieldCheck,
  History,
  CheckCircle2,
} from 'lucide-react';
import { AnalysisResult } from '../types';
import { cn } from '../utils/cn';

interface CookbookPanelProps {
  analysis: AnalysisResult;
}

export function CookbookPanel({ analysis }: CookbookPanelProps) {
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  const toggleStep = (idx: number) => {
    setCompletedSteps(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const steps = analysis.remediationSteps;
  const progress = steps.length === 0 ? 0 : (Object.values(completedSteps).filter(Boolean).length / steps.length) * 100;

  return (
    <div className="space-y-8">
      <div className="flex border border-slate-800 bg-slate-900/50 rounded-xl divide-x divide-slate-800 overflow-hidden">
        <Stat icon={Clock} label="Est. Duration" value={analysis.estimatedTime ?? '—'} color="text-blue-500" />
        <Stat icon={ShieldCheck} label="Escalation" value={analysis.recommendedEscalation ?? '—'} color="text-green-500" />
        <Stat icon={Terminal} label="Steps" value={`${steps.length}`} color="text-slate-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
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

            {steps.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 border border-dashed border-slate-800 rounded-xl">
                No steps were generated for this incident.
              </p>
            ) : (
              <div className="space-y-3">
                {steps.map((step, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleStep(idx)}
                    className={cn(
                      'p-4 rounded-xl border transition-all cursor-pointer group',
                      completedSteps[idx]
                        ? 'bg-slate-900/30 border-green-500/20 opacity-60'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 shadow-sm'
                    )}
                  >
                    <div className="flex gap-4">
                      <button className={cn(
                        'w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors',
                        completedSteps[idx] ? 'bg-green-500 text-slate-950' : 'bg-slate-950 border border-slate-800 text-slate-700 group-hover:border-slate-600'
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
            )}
          </div>

          {analysis.validationSteps && analysis.validationSteps.length > 0 && (
            <div className="p-6 bg-green-500/5 border border-green-500/20 rounded-2xl">
              <h3 className="text-sm font-black text-green-500 uppercase tracking-tight flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4" />
                Post-Recovery Validation
              </h3>
              <ul className="space-y-2">
                {analysis.validationSteps.map((v, i) => (
                  <li key={i} className="text-xs text-slate-400">{v}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {analysis.rollbackPlan && analysis.rollbackPlan.length > 0 && (
            <div className="p-6 bg-red-600/5 border border-red-500/20 rounded-2xl">
              <h3 className="text-sm font-black text-red-500 uppercase tracking-tight flex items-center gap-2 mb-4">
                <History className="w-4 h-4" />
                Rollback Plan
              </h3>
              <div className="space-y-4">
                {analysis.rollbackPlan.map((r, i) => (
                  <div key={i} className="text-xs text-slate-400 leading-relaxed pl-4 border-l border-red-900/50 italic">
                    {r}
                  </div>
                ))}
              </div>
            </div>
          )}

          {analysis.reasoning && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-3">Reasoning</h4>
              <p className="text-xs text-slate-400 italic">{analysis.reasoning}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface StatProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  color: string;
}

function Stat({ icon: Icon, label, value, color }: StatProps) {
  return (
    <div className="flex-1 p-4 flex items-center gap-3">
      <div className={cn('p-2 rounded-lg', `${color.replace('text-', 'bg-')}/10`, color)}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{label}</div>
        <div className="text-xs font-bold text-white">{value}</div>
      </div>
    </div>
  );
}
