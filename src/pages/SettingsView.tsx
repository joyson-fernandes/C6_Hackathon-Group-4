import React from 'react';
import { motion } from 'motion/react';
import { Settings, Shield, User, Zap } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function SettingsView() {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.99 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Configuration</h1>
        <p className="text-slate-400 mt-1">Manage global infrastructure and AI parameters.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside className="space-y-1">
          <button className="w-full text-left px-4 py-2 rounded-md bg-blue-600/10 text-blue-400 border border-blue-500/20 font-bold text-sm flex items-center gap-3">
             <Settings className="w-4 h-4" /> General
          </button>
        </aside>

        <div className="md:col-span-3 space-y-8">
           <Card title="Agent Settings" icon={<Zap className="w-4 h-4 text-blue-500" />}>
              <div className="space-y-6 mt-4">
                 <div className="flex justify-between items-center">
                    <div>
                       <div className="text-sm font-bold text-white">Auto-Pilot Mode</div>
                       <div className="text-xs text-slate-500">Allow AI agents to perform write operations.</div>
                    </div>
                    <div className="w-10 h-5 bg-slate-800 rounded-full flex items-center px-1">
                       <div className="w-3 h-3 bg-slate-600 rounded-full" />
                    </div>
                 </div>
                 <div className="pt-4 border-t border-slate-800">
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-2">Primary Inference Node</label>
                    <select className="w-full bg-slate-900 border border-slate-800 p-2 text-xs text-white rounded">
                       <option>Gemini 3 Flash Preview (Optimized)</option>
                       <option>Custom Enterprise Gateway</option>
                    </select>
                 </div>
              </div>
           </Card>

           <div className="flex justify-end gap-3">
              <Button variant="ghost">Discard</Button>
              <Button>Save Changes</Button>
           </div>
        </div>
      </div>
    </motion.div>
  );
}
