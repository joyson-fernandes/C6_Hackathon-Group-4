import React, { useState, useRef, useCallback } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle2, RefreshCcw, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';
import { Button } from './ui/Button';

interface LogUploaderProps {
  onAnalysisStart: (logs: string) => Promise<void>;
  isAnalyzing: boolean;
}

type UploadStatus = 'idle' | 'dragging' | 'reading' | 'analyzing' | 'success' | 'error';

export function LogUploader({ onAnalysisStart, isAnalyzing }: LogUploaderProps) {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStatus('idle');
    setProgress(0);
    setError(null);
    setFileName(null);
  };

  const handleFile = useCallback(async (file: File) => {
    const validExtensions = ['.log', '.txt', '.json'];
    const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

    if (!validExtensions.includes(extension)) {
      setError(`Invalid file type. Please upload ${validExtensions.join(', ')}`);
      setStatus('error');
      return;
    }

    setFileName(file.name);
    setStatus('reading');
    setError(null);

    // Simulate upload/read progress
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 30;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        
        const reader = new FileReader();
        reader.onload = async (e) => {
          const content = e.target?.result as string;
          setStatus('analyzing');
          try {
            await onAnalysisStart(content);
            setStatus('success');
          } catch (err) {
            setError("Analysis engine failure. System logs might be corrupted.");
            setStatus('error');
          }
        };
        reader.readAsText(file);
      }
      setProgress(Math.min(currentProgress, 100));
    }, 100);
  }, [onAnalysisStart]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setStatus('idle');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setStatus('dragging');
  };

  const onDragLeave = () => {
    setStatus('idle');
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {status === 'idle' || status === 'dragging' ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative border-2 border-dashed rounded-2xl p-12 transition-all cursor-pointer group",
              status === 'dragging' 
                ? "border-blue-500 bg-blue-500/5" 
                : "border-slate-800 hover:border-slate-700 bg-slate-950/50 hover:bg-slate-900/40"
            )}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".log,.txt,.json"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            
            <div className="flex flex-col items-center gap-4 text-center">
              <div className={cn(
                "w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 group-hover:scale-110 transition-transform",
                status === 'dragging' && "border-blue-500 text-blue-500 animate-bounce"
              )}>
                <Upload className={cn("w-8 h-8", status === 'dragging' ? "text-blue-500" : "text-slate-500")} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Upload Operational Logs</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">
                  Drag and drop .log, .txt, or .json files to trigger automated AI incident analysis.
                </p>
              </div>
              <div className="mt-2 px-4 py-1.5 bg-slate-900 border border-slate-800 rounded font-mono text-[10px] text-slate-500 uppercase tracking-widest">
                Max file size: 10MB
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="status"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Background progress indicator */}
            {status === 'reading' && (
              <div className="absolute bottom-0 left-0 h-1 bg-blue-600 transition-all duration-300" style={{ width: `${progress}%` }} />
            )}

            <div className="flex items-start gap-5">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                status === 'reading' || status === 'analyzing' ? "bg-blue-500/10 text-blue-500" :
                status === 'success' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
              )}>
                {status === 'reading' && <Loader2 className="w-6 h-6 animate-spin" />}
                {status === 'analyzing' && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}><RefreshCcw className="w-6 h-6" /></motion.div>}
                {status === 'success' && <CheckCircle2 className="w-6 h-6" />}
                {status === 'error' && <AlertCircle className="w-6 h-6" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-2">
                   <div>
                      <h4 className="font-bold text-white truncate max-w-[300px]">{fileName}</h4>
                      <p className="text-xs text-slate-500 mt-1 uppercase font-mono tracking-tighter">
                        {status === 'reading' && `Ingesting data stream... ${Math.round(progress)}%`}
                        {status === 'analyzing' && `Gemini AI: Processing operational context...`}
                        {status === 'success' && `Ingestion Complete. System stable.`}
                        {status === 'error' && `System error detected.`}
                      </p>
                   </div>
                   {status !== 'reading' && status !== 'analyzing' && (
                     <button onClick={reset} className="text-slate-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                     </button>
                   )}
                </div>

                {status === 'error' && (
                  <div className="mt-4 p-3 bg-red-950/20 border border-red-900/50 rounded-lg flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                    <span className="text-xs text-red-200">{error}</span>
                    <button onClick={reset} className="ml-auto text-xs font-bold text-red-500 hover:underline">Retry</button>
                  </div>
                )}

                {status === 'success' && (
                  <div className="mt-6 flex gap-3">
                     <Button size="sm" className="w-full" onClick={() => window.location.href = '/'}>
                        Dashboard
                     </Button>
                     <Button variant="outline" size="sm" className="w-full" onClick={reset}>
                        Upload More
                     </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
