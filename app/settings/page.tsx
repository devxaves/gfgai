"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { useDashboardStore } from "@/store/useDashboardStore";
import { Settings as SettingsIcon, Moon, Sun, Database, Trash2 } from "lucide-react";
import db from "@/lib/localDatabase";

export default function SettingsPage() {
  const {
    darkMode, toggleDarkMode,
    dataSource, setDataSource,
    clearConversationHistory,
  } = useDashboardStore();

  const handleClearAll = async () => {
    clearConversationHistory();
    await db.clearData();
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="h-[72px] border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl flex items-center px-6 shrink-0">
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
          <div className="max-w-2xl mx-auto space-y-4">

            {/* Theme */}
            <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {darkMode ? <Moon className="w-5 h-5 text-violet-500" /> : <Sun className="w-5 h-5 text-amber-500" />}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Appearance</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{darkMode ? "Dark mode active" : "Light mode active"}</p>
                  </div>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={`relative w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-violet-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>

            {/* Default data source */}
            <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3 mb-3">
                <Database className="w-5 h-5 text-blue-500" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Default Data Source</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Choose where queries run by default</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setDataSource("database")}
                  className={`text-sm px-4 py-2 rounded-lg transition-colors ${
                    dataSource === "database"
                      ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  MongoDB
                </button>
                <button
                  onClick={() => setDataSource("local")}
                  className={`text-sm px-4 py-2 rounded-lg transition-colors ${
                    dataSource === "local"
                      ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  Local CSV
                </button>
              </div>
            </div>

            {/* Danger zone */}
            <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-red-100 dark:border-red-900/30">
              <div className="flex items-center gap-3 mb-3">
                <Trash2 className="w-5 h-5 text-red-500" />
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Clear All Data</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Remove all queries, dashboards, and uploaded data</p>
                </div>
              </div>
              <button
                onClick={handleClearAll}
                className="text-sm px-4 py-2 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
              >
                Clear Everything
              </button>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
