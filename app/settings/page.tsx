"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { useDashboardStore } from "@/store/useDashboardStore";
import { Settings as SettingsIcon, Moon, Sun, Database, Trash2, Download } from "lucide-react";
import db from "@/lib/localDatabase";

export default function SettingsPage() {
  const { darkMode, toggleDarkMode, dataSource, setDataSource, clearConversationHistory, conversationHistory } = useDashboardStore();

  const handleClearAll = async () => {
    clearConversationHistory();
    await db.clearData();
  };

  const handleExportHistory = () => {
    const blob = new Blob([JSON.stringify(conversationHistory, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'insightai-history.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="h-14 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl flex items-center px-6 shrink-0 z-10">
          <div className="w-10 lg:hidden" />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-gray-500 to-gray-700 rounded-xl flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-50">Settings</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Configure your preferences</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-xl mx-auto space-y-5">

            {/* Appearance */}
            <div className="p-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {darkMode ? <Moon className="w-5 h-5 text-indigo-500" /> : <Sun className="w-5 h-5 text-amber-500" />}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Appearance</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{darkMode ? 'Dark' : 'Light'} mode active</p>
                  </div>
                </div>
                <button onClick={toggleDarkMode}
                  className={`relative w-11 h-6 rounded-full transition-colors ${darkMode ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${darkMode ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            </div>

            {/* Data Source */}
            <div className="p-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3 mb-3">
                <Database className="w-5 h-5 text-indigo-500" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Default Data Source</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Choose where queries run by default</p>
                </div>
              </div>
              <div className="flex gap-2">
                {[{ key: 'server' as const, label: 'Built-in Dataset' }, { key: 'local' as const, label: 'Local CSV' }].map(opt => (
                  <button key={opt.key} onClick={() => setDataSource(opt.key)}
                    className={`px-4 py-2 text-sm rounded-lg border transition-all ${
                      dataSource === opt.key
                        ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 font-medium'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Export */}
            {conversationHistory.length > 0 && (
              <div className="p-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Download className="w-5 h-5 text-emerald-500" />
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Export History</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{conversationHistory.length} queries available</p>
                    </div>
                  </div>
                  <button onClick={handleExportHistory}
                    className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors">
                    Download JSON
                  </button>
                </div>
              </div>
            )}

            {/* Clear All */}
            <div className="p-5 bg-white dark:bg-gray-900 rounded-xl border border-red-100 dark:border-red-900/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Clear All Data</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Remove all queries, dashboards, and uploaded data</p>
                  </div>
                </div>
                <button onClick={handleClearAll}
                  className="text-xs font-medium text-red-600 bg-red-50 dark:bg-red-950/30 px-3 py-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                  Clear Everything
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
