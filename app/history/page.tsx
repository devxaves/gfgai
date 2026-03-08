"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { useDashboardStore } from "@/store/useDashboardStore";
import { History as HistoryIcon, BarChart3, Trash2, Play } from "lucide-react";

export default function HistoryPage() {
  const { conversationHistory, clearConversationHistory } = useDashboardStore();

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="h-[72px] border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl flex items-center px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
              <HistoryIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-50">Query History</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">{conversationHistory.length} queries in this session</p>
            </div>
          </div>
          {conversationHistory.length > 0 && (
            <button
              onClick={clearConversationHistory}
              className="ml-auto flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          )}
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            {conversationHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <HistoryIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">No queries yet</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Go to the Dashboard and ask Vizly AI a question.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {conversationHistory.slice().reverse().map((entry) => (
                  <div key={entry.id} className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{entry.query}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(entry.timestamp).toLocaleString()}
                          {entry.error && <span className="ml-2 text-red-400">· Error</span>}
                          {entry.dashboard && entry.dashboard.charts.length > 0 && (
                            <span className="ml-2 text-green-500">· {entry.dashboard.charts.length} chart(s)</span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {entry.dashboard && entry.dashboard.charts.length > 0 && (
                          <span className="text-xs bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md font-medium">
                            {entry.dashboard.charts[0]?.type}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
