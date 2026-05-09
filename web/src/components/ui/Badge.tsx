import React from 'react';
import { cn } from '../../utils/cn';
import { Severity } from '../../types';

const SEVERITY_COLORS = {
  P0: 'bg-red-500/10 text-red-500 border-red-500/20',
  P1: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  P2: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  P3: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  P4: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span className={cn(
      "px-2 py-0.5 rounded text-[10px] font-bold border",
      SEVERITY_COLORS[severity]
    )}>
      {severity}
    </span>
  );
}
