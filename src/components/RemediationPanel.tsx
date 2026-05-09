import React from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Check, 
  Copy, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Terminal, 
  ArrowUpRight, 
  Download,
  Info,
  Server,
  Zap,
  Activity
} from 'lucide-react';
import { AnalysisResult } from '../types';
import { cn } from '../utils/cn';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface RemediationPanelProps {
  analysis: AnalysisResult;
}

export function RemediationPanel({ analysis }: RemediationPanelProps) {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = () => {
    const text = analysis.remediationSteps.join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confidenceColor = analysis.confidence > 0.8 ? "text-green-500" : analysis.confidence > 0.6 ? "text-yellow-500" : "text-red-500";

  return (
    <div className="space-y-6">
      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricBox 
          icon={Server} 
          label="Affected Service" 
          value={analysis.serviceAffected} 
          color="text-blue-500"
        />
        <MetricBox 
          icon={Zap} 
          label="Confidence Delta" 
          value={`${(analysis.confidence * 100).toFixed(0)}%`} 
          color={confidenceColor}
        />
        <MetricBox 
          icon={ShieldAlert} 
          label="Escalation Required" 
          value={analysis.recommendedEscalation} 
          color="text-red-500"
        />
        <MetricBox 
          icon={Activity} 
          label="Est. Restoration" 
          value="12-15m" 
          color="text-slate-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Analysis & Reasoning */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Executive Summary" icon={<Info className="w-4 h-4 text-blue-500" />}>
             <p className="text-slate-300 leading-relaxed mt-2">{analysis.summary}</p>
          </Card>

          <Card title="Root Cause Analysis" icon={<Terminal className="w-4 h-4 text-blue-500" />}>
             <div className="prose prose-invert prose-sm max-w-none mt-2 text-slate-300">
                <ReactMarkdown>{analysis.rootCause}</ReactMarkdown>
             </div>
             <div className="mt-4 p-4 bg-slate-900 border border-slate-800 rounded-lg">
                <h5 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                   <Activity className="w-3 h-3" /> AI_INFERENCE_REASONING
                </h5>
                <p className="text-xs text-slate-400 italic">"{analysis.reasoning}"</p>
             </div>
          </Card>

          <Card title="Technical Remediation Playbook" icon={<Zap className="w-4 h-4 text-blue-500" />}>
             <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] text-slate-500 font-mono">EXECUTION_READY_COMMANDSET</span>
                <div className="flex gap-2">
                   <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={copyToClipboard}>
                      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copied" : "Copy Steps"}
                   </Button>
                   <Button variant="ghost" size="sm" className="h-7 text-[10px]">
                      <Download className="w-3 h-3" /> Export Checklist
                   </Button>
                </div>
             </div>
             <div className="space-y-3">
                {analysis.remediationSteps.map((step, i) => (
                  <div key={i} className="flex gap-4 group">
                     <div className="w-6 h-6 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-mono text-slate-500">{i + 1}</span>
                     </div>
                     <div className="flex-1 pb-4 border-b border-slate-800 group-last:border-0">
                        <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                           <ReactMarkdown>{step}</ReactMarkdown>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </Card>
        </div>

        {/* Right Column: Impact & Escalation */}
        <div className="space-y-6">
           <Card title="Operational Impact" icon={<AlertTriangle className="w-4 h-4 text-yellow-500" />}>
              <div className="mt-2 text-sm text-slate-400 leading-relaxed">
                 {analysis.operationalImpact}
              </div>
              <div className="mt-6 pt-6 border-t border-slate-800">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Blast Radius</span>
                    <span className="text-xs text-red-400 font-bold">Zone: us-east-1a</span>
                 </div>
                 <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                    <div className="w-[65%] h-full bg-red-500/50" />
                 </div>
              </div>
           </Card>

           <Card title="Next Actions" className="bg-blue-600/5 border-blue-500/20">
              <div className="space-y-3 mt-2">
                 <ActionItem label="Trigger Traffic Shift" active />
                 <ActionItem label="Notify External Stakeholders" />
                 <ActionItem label="Lock CD Pipelines" />
              </div>
              <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold group">
                 Proceed with Automation
                 <ArrowUpRight className="w-4 h-4 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Button>
           </Card>
        </div>
      </div>
    </div>
  );
}

function MetricBox({ icon: Icon, label, value, color }: any) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
       <div className={cn("p-2 rounded-lg bg-slate-950 border border-slate-800/50", color)}>
          <Icon className="w-4 h-4" />
       </div>
       <div>
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">{label}</div>
          <div className="text-xs font-bold text-white mt-0.5">{value}</div>
       </div>
    </div>
  );
}

function ActionItem({ label, active }: { label: string; active?: boolean }) {
  return (
    <div className={cn(
      "p-3 rounded border flex justify-between items-center transition-colors",
      active ? "bg-blue-900/20 border-blue-500/30 text-blue-400" : "bg-slate-900 border-slate-800 text-slate-500"
    )}>
       <span className="text-xs font-bold">{label}</span>
       {active && <Zap className="w-3 h-3 fill-blue-400" />}
    </div>
  );
}
