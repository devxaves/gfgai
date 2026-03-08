"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { useDashboardStore } from "@/store/useDashboardStore";
import { History as HistoryIcon, Trash2, Search, AlertCircle, CheckCircle2, BarChart3 } from "lucide-react";

export default function HistoryPage() {
  const { conversationHistory, clearConversationHistory } = useDashboardStore();

  const sortedHistory = [...conversationHistory].reverse();

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="h-14 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl flex items-center px-6 shrink-0 z-10">
          <div className="w-10 lg:hidden" />
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center">
              <HistoryIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-50">Query History</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">{conversationHistory.length} queries in this session</p>
            </div>
          </div>
          {conversationHistory.length > 0 && (
            <button onClick={clearConversationHistory}
              className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-950/30 px-3 py-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
              <Trash2 className="w-3 h-3" /> Clear All
            </button>
          )}
        </header>

        <main className="flex-1 overflow-auto p-6">
          {sortedHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400">No queries yet</h3>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Go to the Dashboard and ask a question to get started.</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-3">
              {sortedHistory.map((entry) => (
                <div key={entry.id} className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-sm transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      entry.error ? 'bg-red-100 dark:bg-red-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'
                    }`}>
                      {entry.error ? <AlertCircle className="w-4 h-4 text-red-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{entry.query}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-gray-400">{new Date(entry.timestamp).toLocaleString()}</span>
                        {entry.error && <span className="text-xs text-red-500">Error</span>}
                        {entry.dashboard?.charts && entry.dashboard.charts.length > 0 && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <BarChart3 className="w-3 h-3" /> {entry.dashboard.charts.length} chart{entry.dashboard.charts.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      {entry.dashboard?.summary && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{entry.dashboard.summary}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
