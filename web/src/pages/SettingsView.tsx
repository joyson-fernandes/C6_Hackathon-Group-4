import { motion } from 'motion/react';
import { Settings, Zap, Server, Trash2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAnalysisStore } from '../store/AnalysisStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function SettingsView() {
  const { runs, clearRuns } = useAnalysisStore();

  return (
    <motion.div initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Configuration</h1>
        <p className="text-slate-400 mt-1">Backend wiring, model defaults, and local run history.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="space-y-1">
          <button className="w-full text-left px-4 py-2 rounded-md bg-blue-600/10 text-blue-400 border border-blue-500/20 font-bold text-sm flex items-center gap-3">
            <Settings className="w-4 h-4" /> General
          </button>
        </aside>

        <div className="md:col-span-3 space-y-8">
          <Card title="Backend" icon={<Server className="w-4 h-4 text-blue-500" />}>
            <div className="space-y-4 mt-4">
              <Field label="API URL" value={API_URL} hint="Set VITE_API_URL in web/.env" />
              <Field label="Endpoint" value="POST /api/analyze" />
              <Field label="Provider" value="OpenRouter" hint="Configured in agents/config.py" />
            </div>
          </Card>

          <Card title="Model" icon={<Zap className="w-4 h-4 text-blue-500" />}>
            <div className="space-y-4 mt-4">
              <Field label="Default" value="anthropic/claude-sonnet-4.5" hint="Override via OPENROUTER_MODEL" />
              <Field label="Structured output" value="Pydantic v2 schemas" />
            </div>
          </Card>

          <Card title="Local Run History" icon={<Trash2 className="w-4 h-4 text-blue-500" />}>
            <div className="mt-4 space-y-4">
              <Field label="Stored runs" value={`${runs.length} (max 25)`} hint="Persisted to localStorage as opsgpt:runs" />
              <div className="flex justify-end">
                <Button variant="outline" onClick={clearRuns} disabled={runs.length === 0}>
                  Clear all runs
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}

function Field({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-2">{label}</label>
      <div className="bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white rounded font-mono break-all">{value}</div>
      {hint && <p className="text-[10px] text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}
