"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  message: string;
  onRetry?: () => void;
}

export function ErrorCard({ message, onRetry }: Props) {
  return (
    <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50 rounded-2xl">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-xl flex items-center justify-center shrink-0">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-red-800 dark:text-red-300">Something went wrong</p>
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">{message}</p>
          <div className="mt-3 flex items-center gap-3">
            {onRetry && (
              <button onClick={onRetry}
                className="flex items-center gap-1.5 text-xs font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 px-3 py-1.5 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
                <RefreshCw className="w-3 h-3" /> Try again
              </button>
            )}
            <p className="text-xs text-red-400 dark:text-red-500">Try rephrasing your question, or wait and retry.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
