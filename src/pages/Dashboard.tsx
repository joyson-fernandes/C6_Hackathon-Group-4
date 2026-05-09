import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Clock, CheckCircle2, Activity, ArrowUpRight, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { SeverityBadge } from '../components/ui/Badge';
import { useIncidents } from '../hooks/useIncidents';
import { LogUploader } from '../components/LogUploader';
import { useAnalysis } from '../hooks/useAnalysis';

export function Dashboard() {
  const { incidents, loading } = useIncidents();
  const { analyze, isAnalyzing } = useAnalysis();
  const navigate = useNavigate();
  const [showUploader, setShowUploader] = useState(false);

  const handleAnalysis = async (logs: string) => {
    const result = await analyze(logs);
    if (result) {
      // In a real app, we'd save this to a DB and then navigate to the new incident
      // For demo, we just navigate to a placeholder or stay on dashboard showing success
      setTimeout(() => {
        navigate('/incidents/INC-2026-001'); // Placeholder navigation
      }, 1500);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full text-slate-500 font-mono">LOADING_SYSTEM_STATE...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">System Overview</h1>
          <p className="text-slate-400 mt-1">Real-time incident analysis and infrastructure health.</p>
        </div>
        <button 
          onClick={() => setShowUploader(!showUploader)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
        >
          <Sparkles className="w-5 h-5" />
          <span>{showUploader ? 'Close Uploader' : 'Analyze Logs'}</span>
        </button>
      </div>

      <AnimatePresence>
        {showUploader && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pb-8">
              <LogUploader onAnalysisStart={handleAnalysis} isAnalyzing={isAnalyzing} />
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Active Incidents" value="3" icon={AlertCircle} color="text-red-500" />
        <StatCard label="MTTR" value="42m" icon={Clock} color="text-blue-500" />
        <StatCard label="Success Rate" value="94.2%" icon={CheckCircle2} color="text-green-500" />
        <StatCard label="System Health" value="Healthy" icon={Activity} color="text-indigo-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <Card title="Traffic & Metrics">
              <div className="h-48 flex items-end gap-1 px-2">
                 {Array.from({ length: 40 }).map((_, i) => (
                   <div key={i} className="flex-1 bg-blue-500/20 rounded-t-sm" style={{ height: `${Math.random() * 80 + 20}%` }} />
                 ))}
              </div>
           </Card>

           <Card title="Active Incidents Queue">
             <div className="overflow-hidden border border-slate-800 rounded-lg">
               <table className="w-full text-left text-sm">
                 <thead className="bg-slate-900/50 text-slate-400 font-mono">
                   <tr className="text-[10px] uppercase">
                     <th className="px-4 py-3">Incident</th>
                     <th className="px-4 py-3">Severity</th>
                     <th className="px-4 py-3">Status</th>
                     <th className="px-4 py-3 text-right">Action</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-800">
                   {incidents.map((incident) => (
                     <tr key={incident.id} className="hover:bg-slate-900/30 transition-colors">
                       <td className="px-4 py-4">
                         <div className="font-bold text-white">{incident.id}</div>
                         <div className="text-xs text-slate-500 truncate">{incident.title}</div>
                       </td>
                       <td className="px-4 py-4"><SeverityBadge severity={incident.severity} /></td>
                       <td className="px-4 py-4 text-xs font-bold uppercase text-slate-400">{incident.status}</td>
                       <td className="px-4 py-4 text-right">
                         <Link to={`/incidents/${incident.id}`} className="text-blue-500 font-bold hover:underline inline-flex items-center gap-1">
                           Analyze <ArrowUpRight className="w-3 h-3" />
                         </Link>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </Card>
        </div>

        <div className="space-y-6">
           <Card title="Agent Pulse">
              <div className="space-y-4">
                 {['LogParser', 'NetworkSage', 'SecurityBot'].map(n => (
                   <div key={n} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                      <div className="text-sm font-bold text-white">{n}</div>
                      <div className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[10px] font-bold rounded">IDLE</div>
                   </div>
                 ))}
              </div>
           </Card>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="p-2 bg-slate-900 rounded-lg">
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-400">{label}</p>
        <h3 className="text-2xl font-bold text-white mt-1 tracking-tight">{value}</h3>
      </div>
    </Card>
  );
}
