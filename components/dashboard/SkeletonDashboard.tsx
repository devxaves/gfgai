"use client";

import { useState, useEffect } from "react";
import { Sparkles, Brain, BarChart3, Palette } from "lucide-react";

const STEPS = [
  { label: "Understanding your question...", icon: Brain, duration: 600 },
  { label: "Analyzing the dataset...", icon: BarChart3, duration: 1200 },
  { label: "Selecting best visualizations...", icon: Palette, duration: 600 },
  { label: "Rendering your dashboard...", icon: Sparkles, duration: 400 },
];

export function SkeletonDashboard() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    const advance = (current: number) => {
      if (current < STEPS.length - 1) {
        timeout = setTimeout(() => {
          setStep(current + 1);
          advance(current + 1);
        }, STEPS[current].duration);
      }
    };
    advance(0);
    return () => clearTimeout(timeout);
  }, []);

  const CurrentIcon = STEPS[step].icon;

  return (
    <div className="space-y-5">
      {/* Progress indicator */}
      <div className="flex items-center justify-center py-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center animate-pulse shadow-lg shadow-indigo-500/20">
            <CurrentIcon className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{STEPS[step].label}</p>
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all duration-300 ${
                i <= step ? 'w-6 bg-indigo-500' : 'w-3 bg-gray-200 dark:bg-gray-700'
              }`} />
            ))}
          </div>
        </div>
      </div>

      {/* Skeleton KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
            <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>

      {/* Skeleton charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[0, 1].map(i => (
          <div key={i} className="p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 animate-pulse min-h-[300px]" style={{ animationDelay: `${i * 150}ms` }}>
            <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
            <div className="flex items-end gap-2 h-48 mt-auto">
              {[40, 65, 50, 80, 55, 70, 45].map((h, j) => (
                <div key={j} className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-t" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
