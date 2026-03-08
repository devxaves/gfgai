"use client";

import { useEffect, useState, useRef } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { DashboardMetric } from "@/types";

const ACCENT_COLORS = [
  { bg: 'bg-indigo-50 dark:bg-indigo-950/30', border: 'border-indigo-100 dark:border-indigo-900/30', icon: 'text-indigo-600', badge: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400' },
  { bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-100 dark:border-violet-900/30', icon: 'text-violet-600', badge: 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-400' },
  { bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-100 dark:border-emerald-900/30', icon: 'text-emerald-600', badge: 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400' },
  { bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-100 dark:border-amber-900/30', icon: 'text-amber-600', badge: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400' },
];

function useCountUp(target: number, duration = 800): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>(undefined);

  useEffect(() => {
    let start: number | null = null;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return value;
}

interface Props extends DashboardMetric {
  index: number;
}

export function KPICard({ title, value, trend, trendPositive, index }: Props) {
  const colors = ACCENT_COLORS[index % ACCENT_COLORS.length];

  // Extract numeric value for count-up
  const numericStr = String(value).replace(/[^0-9.]/g, '');
  const numericVal = parseFloat(numericStr) || 0;
  const prefix = String(value).match(/^[^0-9]*/)?.[0] || '';
  const suffix = String(value).match(/[^0-9.]*$/)?.[0] || '';
  const hasDecimal = numericStr.includes('.');

  const animated = useCountUp(numericVal);
  const displayVal = numericVal > 0 ? `${prefix}${hasDecimal ? animated.toFixed(1) : animated.toLocaleString()}${suffix}` : value;

  const TrendIcon = trendPositive === undefined ? Minus : trendPositive ? TrendingUp : TrendingDown;
  const trendColor = trendPositive === undefined ? 'text-gray-400' : trendPositive ? 'text-emerald-600' : 'text-red-500';

  return (
    <div className={`p-4 rounded-xl border ${colors.border} ${colors.bg} transition-all hover:shadow-sm`}>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 truncate">{title}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-gray-50 tabular-nums">{displayVal}</p>
      {trend && (
        <div className={`flex items-center gap-1 mt-1.5 text-xs ${trendColor}`}>
          <TrendIcon className="w-3 h-3" />
          <span className="truncate">{trend}</span>
        </div>
      )}
    </div>
  );
}
