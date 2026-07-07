import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LiveClock({ className }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const date = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className={cn(
      'flex items-center gap-2 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-1.5 shadow-[0_0_18px_rgba(16,185,129,0.18)]',
      className
    )}>
      <Clock className="h-3.5 w-3.5 text-emerald-300" />
      <span className="font-mono text-sm font-semibold tabular-nums text-emerald-200">{time}</span>
      <span className="text-[10px] uppercase tracking-wider text-emerald-300/60">{date}</span>
    </div>
  );
}
