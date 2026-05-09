import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}

export function Card({ title, children, className, icon }: CardProps) {
  return (
    <div className={cn("bg-slate-950/40 border border-slate-800 p-6 rounded-xl relative overflow-hidden backdrop-blur-sm", className)}>
      <div className="absolute top-0 left-0 w-1 h-full bg-slate-800" />
      {title && (
        <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-4">
          {icon || <div className="w-1.5 h-1.5 bg-blue-500 rounded-sm" />}
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
