import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  History,
  Settings,
  Terminal,
  AlertTriangle,
  Zap,
  Search,
  ShieldAlert,
  Bell,
  User,
  Signal,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useIncidents } from '../hooks/useIncidents';

export function DashboardLayout() {
  const { incidents } = useIncidents();
  const p0Count = incidents.filter(i => i.severity === 'P0' && i.status !== 'resolved').length;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      <aside className="w-64 border-r border-slate-800 bg-slate-950 flex flex-col h-full sticky top-0 shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <Terminal className="text-white w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">OpsGPT</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {[
            { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
            { icon: AlertTriangle, label: 'Incidents', path: '/incidents' },
            { icon: Zap, label: 'Agent Workflow', path: '/workflow' },
            { icon: Signal, label: 'Integrations', path: '/integrations' },
            { icon: History, label: 'History', path: '/history' },
            { icon: Settings, label: 'Settings', path: '/settings' },
          ].map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200 group',
                  isActive
                    ? 'bg-slate-900 text-blue-400 border border-slate-800'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                )
              }
              end={item.path === '/'}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-800">
          <div className="bg-slate-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={cn('w-2 h-2 rounded-full animate-pulse', p0Count === 0 ? 'bg-green-500' : 'bg-red-500')} />
              <span className="text-xs font-mono text-slate-300 uppercase tracking-widest">Pipeline</span>
            </div>
            <div className="text-sm font-bold text-white">{incidents.length} incidents tracked</div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-800 bg-slate-950/50 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-50">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-full px-4 py-1.5 w-96">
            <Search className="w-4 h-4 text-slate-500 mr-2" />
            <input
              type="text"
              placeholder="Search incidents, services, or runs..."
              className="bg-transparent border-none focus:outline-none text-sm text-slate-300 w-full"
            />
          </div>

          <div className="flex items-center gap-6">
            {p0Count > 0 && (
              <div className="flex items-center gap-4 py-1 px-3 bg-red-950/30 border border-red-900/50 rounded-md">
                <ShieldAlert className="w-4 h-4 text-red-500" />
                <span className="text-xs font-bold text-red-500 uppercase">{p0Count} Active P0</span>
              </div>
            )}
            <div className="flex items-center gap-4">
              <Bell className="w-5 h-5 text-slate-400 cursor-pointer" />
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center border-2 border-slate-800">
                <User className="text-white w-4 h-4" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
