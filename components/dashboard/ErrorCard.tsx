"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorCardProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorCard({ message, onRetry }: ErrorCardProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-red-200 dark:border-red-900 rounded-2xl bg-red-50/50 dark:bg-red-950/20">
      <div className="w-14 h-14 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-7 h-7 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Something went wrong</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center max-w-md mb-4">
        {message}
      </p>
      <div className="text-xs text-gray-400 dark:text-gray-500 text-center max-w-sm">
        <strong>Tips:</strong> Try rephrasing your query, make it more specific, or check that your dataset has the fields you&apos;re referencing.
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
}
