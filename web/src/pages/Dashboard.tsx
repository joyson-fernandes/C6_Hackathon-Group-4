import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, Clock, CheckCircle2, Activity, ArrowUpRight, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { SeverityBadge } from '../components/ui/Badge';
import { useIncidents } from '../hooks/useIncidents';
import { LogUploader } from '../components/LogUploader';
import { useAnalysis } from '../hooks/useAnalysis';

export function Dashboard() {
  const { incidents } = useIncidents();
  const { analyze, isAnalyzing, error } = useAnalysis();
  const navigate = useNavigate();
  const [showUploader, setShowUploader] = useState(incidents.length === 0);

  const handleAnalysis = async (logs: string, fileName?: string) => {
    const report = await analyze(logs, fileName);
    if (report && report.incidents.length > 0) {
      setTimeout(() => navigate(`/incidents/${report.incidents[0].id}`), 600);
    }
  };

  const activeCount = incidents.filter(i => i.status !== 'resolved' && i.status !== 'closed').length;
  const resolvedCount = incidents.filter(i => i.status === 'resolved').length;
  const successRate = incidents.length > 0 ? `${Math.round((resolvedCount / incidents.length) * 100)}%` : '—';
  const systemHealth = activeCount === 0 ? 'Healthy' : activeCount < 3 ? 'Degraded' : 'Critical';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">System Overview</h1>
          <p className="text-slate-400 mt-1">Upload logs to run multi-agent incident analysis.</p>
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
              <LogUploader onAnalysisStart={handleAnalysis} isAnalyzing={isAnalyzing} error={error} />
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Active Incidents" value={String(activeCount)} icon={AlertCircle} color="text-red-500" />
        <StatCard label="Total Analyzed" value={String(incidents.length)} icon={Clock} color="text-blue-500" />
        <StatCard label="Resolution Rate" value={successRate} icon={CheckCircle2} color="text-green-500" />
        <StatCard label="System Health" value={systemHealth} icon={Activity} color={systemHealth === 'Healthy' ? 'text-green-500' : 'text-yellow-500'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card title="Active Incidents Queue">
            {incidents.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p className="text-sm">No incidents yet.</p>
                <p className="text-xs mt-1">Upload a log file to populate the queue.</p>
              </div>
            ) : (
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
                    {incidents.slice(0, 10).map((incident) => (
                      <tr key={incident.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="px-4 py-4">
                          <div className="font-bold text-white">{incident.id}</div>
                          <div className="text-xs text-slate-500 truncate max-w-md">{incident.title}</div>
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
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Pipeline Agents">
            <div className="space-y-4">
              {['Classifier', 'Remediation', 'Cookbook', 'Slack', 'JIRA', 'Report'].map(n => (
                <div key={n} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-800">
                  <div className="text-sm font-bold text-white">{n}</div>
                  <div className={`px-2 py-0.5 text-[10px] font-bold rounded ${incidents.length ? 'bg-green-500/10 text-green-500' : 'bg-slate-700/30 text-slate-500'}`}>
                    {incidents.length ? 'READY' : 'IDLE'}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
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
