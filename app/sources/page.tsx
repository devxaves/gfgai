"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useDashboardStore } from "@/store/useDashboardStore";
import { DatasetUploader } from "@/components/dashboard/DatasetUploader";
import { Database, HardDrive, FileSpreadsheet, Trash2 } from "lucide-react";
import db from "@/lib/localDatabase";

export default function SourcesPage() {
  const { dataSource, setDataSource, uploadedSchema, activeDatasetName, uploadedRowCount } = useDashboardStore();
  const [localCount, setLocalCount] = useState(0);

  useEffect(() => {
    db.getRowCount().then(setLocalCount);
  }, [uploadedRowCount]);

  const handleClearLocal = async () => {
    await db.clearData();
    setLocalCount(0);
    setDataSource("database");
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="h-[72px] border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl flex items-center px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-50">Data Sources</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Manage your datasets</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Active Source */}
            <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Active Source</h2>
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${dataSource === 'database' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                <span className="text-base font-medium text-gray-900 dark:text-gray-100">
                  {dataSource === 'database' ? 'MongoDB Atlas' : `Local CSV — ${activeDatasetName || 'Uploaded Data'}`}
                </span>
              </div>
            </div>

            {/* MongoDB */}
            <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3 mb-3">
                <HardDrive className="w-5 h-5 text-green-500" />
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">MongoDB Atlas</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Demo sales dataset with product, region, revenue, cost, and date fields.
              </p>
              <button
                onClick={() => setDataSource("database")}
                disabled={dataSource === "database"}
                className="text-sm px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {dataSource === "database" ? "Active" : "Switch to MongoDB"}
              </button>
            </div>

            {/* Local data */}
            <div className="p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-blue-500" />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Local Dataset</h3>
                </div>
                {localCount > 0 && (
                  <button
                    onClick={handleClearLocal}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear
                  </button>
                )}
              </div>

              {localCount > 0 ? (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <strong>{activeDatasetName}</strong> — {localCount.toLocaleString()} rows
                  </p>
                  {uploadedSchema.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {uploadedSchema.map(col => (
                        <span key={col} className="text-[11px] px-2 py-0.5 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 font-mono text-gray-600 dark:text-gray-400">
                          {col}
                        </span>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => setDataSource("local")}
                    disabled={dataSource === "local"}
                    className="text-sm px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {dataSource === "local" ? "Active" : "Switch to Local"}
                  </button>
                </div>
              ) : (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <p className="mb-3">No local dataset uploaded yet.</p>
                  <DatasetUploader />
                </div>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
