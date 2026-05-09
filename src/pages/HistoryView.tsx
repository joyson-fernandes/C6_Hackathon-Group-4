import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  Search, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  AlertCircle, 
  Zap, 
  CheckCircle2, 
  BellOff,
  Activity,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useIncidents } from '../hooks/useIncidents';
import { Card } from '../components/ui/Card';
import { SeverityBadge } from '../components/ui/Badge';
import { cn } from '../utils/cn';
import { format } from 'date-fns';

export function HistoryView() {
  const { incidents, loading } = useIncidents();
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredIncidents = incidents.filter(i => {
    const matchesSearch = 
      i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.incidentType.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesSeverity = severityFilter === 'All' || i.severity === severityFilter;
    const matchesStatus = statusFilter === 'All' || i.status === statusFilter.toLowerCase();

    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const totalPages = Math.ceil(filteredIncidents.length / itemsPerPage);
  const paginatedIncidents = filteredIncidents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-slate-500 font-mono text-sm tracking-widest uppercase">Syncing_Incident_Repository...</span>
    </div>
  );

  // Summary Metrics
  const criticalCount = incidents.filter(i => i.severity === 'P0').length;
  const activeWorkflows = incidents.filter(i => i.status === 'active' || i.status === 'analyzing' || i.status === 'remediating').length;
  const resolvedCount = incidents.filter(i => i.status === 'resolved').length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
           <div className="w-1.5 h-10 bg-blue-600 rounded-full" />
           <div>
             <h1 className="text-3xl font-bold text-white tracking-tight">Incident Command</h1>
             <div className="flex items-center gap-2 text-slate-400 mt-1">
               <span className="flex items-center gap-1.5">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-[10px] font-mono tracking-widest uppercase">Live System Feed</span>
               </span>
               <span className="text-slate-700 mx-2">|</span>
               <p className="text-sm">Real-time observability and automated recovery audit.</p>
             </div>
           </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md text-xs font-bold text-slate-300 flex items-center gap-2 transition-colors group">
            <Download className="w-4 h-4 group-hover:text-blue-500 transition-colors" /> Export Operations Audit
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard 
          label="P0 Incidents" 
          value={criticalCount} 
          icon={AlertCircle} 
          color="text-red-500" 
          badge="Action Required"
        />
        <SummaryCard 
          label="Workflows In Flight" 
          value={activeWorkflows} 
          icon={Zap} 
          color="text-blue-500" 
          badge="Live Agents"
        />
        <SummaryCard 
          label="Failed Alerts" 
          value="0" 
          icon={BellOff} 
          color="text-yellow-500" 
          badge="Channel Normal"
        />
        <SummaryCard 
          label="Resolved Today" 
          value={resolvedCount} 
          icon={CheckCircle2} 
          color="text-green-500" 
          badge="Auto-Remediated"
        />
      </div>

      {/* Main Incident Section */}
      <Card className="p-0 border-slate-800/60 shadow-2xl relative overflow-visible">
        {/* Table Filters */}
        <div className="p-5 border-b border-slate-800 flex flex-wrap gap-4 items-center bg-slate-900/20 backdrop-blur-sm sticky top-[64px] z-30 rounded-t-xl">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by ID, Service, or Incident Type..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-300 outline-none transition-all placeholder:text-slate-600"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-3 gap-2">
               <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">Severity</span>
               <select 
                 value={severityFilter}
                 onChange={(e) => {
                   setSeverityFilter(e.target.value);
                   setCurrentPage(1);
                 }}
                 className="bg-transparent border-none text-xs font-bold py-2 text-slate-300 focus:outline-none cursor-pointer"
               >
                 <option value="All">All</option>
                 <option value="P0">P0</option>
                 <option value="P1">P1</option>
                 <option value="P2">P2</option>
                 <option value="P3">P3</option>
               </select>
            </div>
            
            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg px-3 gap-2">
               <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest whitespace-nowrap">Status</span>
               <select 
                 value={statusFilter}
                 onChange={(e) => {
                   setStatusFilter(e.target.value);
                   setCurrentPage(1);
                 }}
                 className="bg-transparent border-none text-xs font-bold py-2 text-slate-300 focus:outline-none cursor-pointer"
               >
                 <option value="All">All</option>
                 <option value="Active">Active</option>
                 <option value="Analyzing">Analyzing</option>
                 <option value="Remediating">Remediating</option>
                 <option value="Resolved">Resolved</option>
               </select>
            </div>
          </div>
        </div>


        {/* Desktop Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900/40 text-slate-500 text-[10px] uppercase font-mono tracking-[0.15em] border-b border-slate-800">
              <tr>
                <th className="px-6 py-4 w-10"></th>
                <th className="px-6 py-4 font-bold">Timestamp</th>
                <th className="px-6 py-4 font-bold">Service / Component</th>
                <th className="px-6 py-4 font-bold">Severity</th>
                <th className="px-6 py-4 font-bold">Incident Type</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Workflow</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {paginatedIncidents.map((incident) => (
                <React.Fragment key={incident.id}>
                  <tr 
                    className={cn(
                      "group hover:bg-slate-800/20 transition-colors cursor-pointer",
                      expandedRows[incident.id] ? "bg-blue-900/5" : ""
                    )}
                    onClick={() => toggleRow(incident.id)}
                  >
                    <td className="px-6 py-4">
                      {expandedRows[incident.id] ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-mono text-slate-400">
                        {format(new Date(incident.timestamp), 'HH:mm:ss')}
                      </div>
                      <div className="text-[10px] text-slate-600 font-mono uppercase mt-0.5">
                        {format(new Date(incident.timestamp), 'MMM dd')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{incident.serviceName}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{incident.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <SeverityBadge severity={incident.severity} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-slate-300">{incident.incidentType}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          incident.status === 'active' ? "bg-red-500 animate-pulse" :
                          incident.status === 'analyzing' ? "bg-blue-500" :
                          incident.status === 'resolved' ? "bg-green-500" : "bg-slate-500"
                        )} />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          {incident.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2 text-xs font-mono text-blue-400/80">
                         <Zap className="w-3 h-3" />
                         {incident.assignedWorkflow}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <Link 
                        to={`/incidents/${incident.id}`} 
                        className="p-1 px-3 bg-slate-900 border border-slate-800 rounded group-hover:border-slate-700 text-xs font-bold text-slate-400 hover:text-white transition-all inline-flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                       >
                         Manage <ExternalLink className="w-3 h-3" />
                       </Link>
                    </td>
                  </tr>

                  {/* Expandable Content */}
                  <AnimatePresence>
                    {expandedRows[incident.id] && (
                      <motion.tr
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-slate-900/30 overflow-hidden"
                      >
                        <td colSpan={8} className="p-0 overflow-hidden">
                          <div className="p-8 border-l-2 border-blue-500/50 m-4 ml-14 bg-slate-900/50 rounded-r-xl border border-slate-800 shadow-inner">
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div className="space-y-4">
                                   <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Issue Description</div>
                                   <p className="text-sm text-slate-300 leading-relaxed font-sans italic border-l-2 border-slate-800 pl-4 py-1">
                                     "{incident.shortDescription}"
                                   </p>
                                </div>
                                <div className="space-y-4 text-xs">
                                   <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Impacted Infrastructure</div>
                                   <div className="flex flex-wrap gap-2">
                                      {['US-East-1', 'VPC-Peering', 'K8s-Prod-01'].map(tag => (
                                        <span key={tag} className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono uppercase tracking-tighter">
                                          {tag}
                                        </span>
                                      ))}
                                   </div>
                                </div>
                                <div className="space-y-4">
                                   <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-1">Operational State</div>
                                   <div className="space-y-2">
                                      <div className="flex justify-between items-center text-xs">
                                         <span className="text-slate-500">Log Ingestion</span>
                                         <span className="text-green-500 uppercase font-bold">Operational</span>
                                      </div>
                                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                         <div className="w-full h-full bg-green-500/50" />
                                      </div>
                                      <Link to={`/incidents/${incident.id}`} className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-blue-500 hover:text-blue-400 group/link">
                                        Open Detailed Analysis View
                                        <ArrowRight className="w-3 h-3 transition-transform group-hover/link:translate-x-1" />
                                      </Link>
                                   </div>
                                </div>
                             </div>
                          </div>
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40 flex items-center justify-between">
           <div className="text-[10px] text-slate-500 font-mono uppercase">
              Page {currentPage} of {Math.max(1, totalPages)} | Showing {paginatedIncidents.length} of {filteredIncidents.length} Records
           </div>
           <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 rounded border border-slate-800 bg-slate-900 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
              >
                 <ChevronDown className="w-4 h-4 text-slate-400 rotate-90" />
              </button>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="w-8 h-8 rounded border border-slate-800 bg-slate-900 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
              >
                 <ChevronDown className="w-4 h-4 text-slate-400 -rotate-90" />
              </button>
           </div>
        </div>
      </Card>
    </motion.div>
  );
}

function SummaryCard({ label, value, icon: Icon, color, badge }: any) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl relative overflow-hidden group hover:border-slate-700 transition-all shadow-lg hover:shadow-blue-500/5">
      <div className="absolute top-0 right-0 p-3">
        <Icon className={cn("w-12 h-12 opacity-[0.03] group-hover:opacity-10 transition-opacity", color)} />
      </div>
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-3">
           <div className={cn("p-2 rounded-lg bg-slate-950 border border-slate-800", color)}>
             <Icon className="w-4 h-4" />
           </div>
           <span className={cn("text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border border-slate-800/50 bg-slate-950", color)}>
             {badge}
           </span>
        </div>
        <h3 className="text-2xl font-black text-white tracking-tighter">{value}</h3>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{label}</p>
      </div>
    </div>
  );
}
