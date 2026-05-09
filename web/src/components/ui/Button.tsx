import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  loading, 
  className, 
  children, 
  ...props 
}: ButtonProps) {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 active:scale-95",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200",
    outline: "bg-transparent border border-slate-800 hover:bg-slate-900 text-slate-300",
    ghost: "bg-transparent text-slate-400 hover:text-white"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button 
      className={cn(
        "rounded-md font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <div className="w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin" />}
      {!loading && children}
    </button>
  );
}
