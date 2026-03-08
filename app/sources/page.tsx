"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { useDashboardStore } from "@/store/useDashboardStore";
import { DatasetUploader } from "@/components/dashboard/DatasetUploader";
import { Database, HardDrive, FileSpreadsheet, Trash2, CheckCircle2 } from "lucide-react";
import db from "@/lib/localDatabase";

export default function SourcesPage() {
  const { dataSource, setDataSource, uploadedSchema, activeDatasetName, uploadedRowCount, setUploadedSchema, setActiveDatasetName, setUploadedRowCount } = useDashboardStore();

  const clearLocalData = async () => {
    await db.clearData();
    setUploadedSchema([]);
    setActiveDatasetName('');
    setUploadedRowCount(0);
    setDataSource('server');
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="h-14 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl flex items-center px-6 shrink-0 z-10">
          <div className="w-10 lg:hidden" />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-50">Data Sources</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Manage your datasets</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl mx-auto space-y-5">

            {/* Built-in dataset */}
            <div className={`p-5 rounded-xl border-2 transition-colors cursor-pointer ${
              dataSource === 'server' ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
            }`} onClick={() => setDataSource('server')}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center">
                    <HardDrive className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Built-in Sales Dataset</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">155 sales records from 2024</p>
                  </div>
                </div>
                {dataSource === 'server' && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {['order_id', 'date', 'product', 'category', 'region', 'sales_rep', 'revenue', 'cost', 'units_sold', 'customer_segment'].map(col => (
                  <span key={col} className="text-[11px] px-2 py-0.5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md border border-gray-200 dark:border-gray-700 font-mono">{col}</span>
                ))}
              </div>
            </div>

            {/* Local CSV */}
            <div className={`p-5 rounded-xl border-2 transition-colors ${
              dataSource === 'local' ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/50 rounded-xl flex items-center justify-center">
                    <FileSpreadsheet className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                      {activeDatasetName ? activeDatasetName : 'Local CSV / JSON'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {uploadedRowCount > 0 ? `${uploadedRowCount.toLocaleString()} rows loaded` : 'Upload a file to get started'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {dataSource === 'local' && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                </div>
              </div>

              {uploadedSchema.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {uploadedSchema.map(col => (
                    <span key={col} className="text-[11px] px-2 py-0.5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md border border-gray-200 dark:border-gray-700 font-mono">{col}</span>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center gap-3">
                <DatasetUploader />
                {uploadedRowCount > 0 && (
                  <button onClick={clearLocalData}
                    className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-950/30 px-3 py-1.5 rounded-lg transition-colors">
                    <Trash2 className="w-3 h-3" /> Clear Data
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
