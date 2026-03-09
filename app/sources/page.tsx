"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { useDashboardStore } from "@/store/useDashboardStore";
import { DatasetUploader } from "@/components/dashboard/DatasetUploader";
import { Database, HardDrive, FileSpreadsheet, Trash2, CheckCircle2, Cloud, Laptop, Tag, Rows3, Columns3 } from "lucide-react";
import db from "@/lib/localDatabase";

export default function SourcesPage() {
  const {
    datasets, activeDatasetId, dataSource,
    uploadedSchema, uploadedRowCount,
    setDataSource, setUploadedSchema, setActiveDatasetName,
    setUploadedRowCount, setActiveDatasetId, setMongoCollection,
  } = useDashboardStore();

  const preloaded = datasets.filter(d => d.type === 'preloaded');
  const local     = datasets.filter(d => d.type === 'local');
  const cloud     = datasets.filter(d => d.type === 'cloud');

  const handleSelect = (ds: typeof datasets[0]) => {
    setActiveDatasetId(ds.id);
    setActiveDatasetName(ds.name);
    if (ds.type === 'preloaded') {
      setDataSource('server');
      setUploadedSchema([]);
    } else if (ds.type === 'cloud') {
      setDataSource('mongodb');
      setUploadedSchema(ds.columns);
      setMongoCollection(ds.id);
    } else {
      setDataSource('local');
      setUploadedSchema(ds.columns);
    }
  };

  const clearLocalData = async () => {
    await db.clearData();
    setUploadedSchema([]);
    setActiveDatasetName('');
    setUploadedRowCount(0);
    setDataSource('server');
  };

  const TypeIcon  = { preloaded: HardDrive, local: Laptop, cloud: Cloud };
  const TypeColor = { preloaded: 'text-indigo-600', local: 'text-violet-600', cloud: 'text-emerald-600' };
  const TypeBg    = { preloaded: 'bg-indigo-100 dark:bg-indigo-900/50', local: 'bg-violet-100 dark:bg-violet-900/50', cloud: 'bg-emerald-100 dark:bg-emerald-900/50' };
  const TypeBadge = { preloaded: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800', local: 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800', cloud: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' };

  const DatasetCard = ({ ds }: { ds: typeof datasets[0] }) => {
    const isActive = ds.id === activeDatasetId;
    const Icon = TypeIcon[ds.type];
    return (
      <div
        onClick={() => handleSelect(ds)}
        className={`p-5 rounded-xl border-2 transition-all cursor-pointer ${
          isActive
            ? 'border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-sm'
            : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${TypeBg[ds.type]}`}>
              <Icon className={`w-5 h-5 ${TypeColor[ds.type]}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">{ds.name}</h3>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border capitalize ${TypeBadge[ds.type]}`}>
                  {ds.type}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Rows3 className="w-3 h-3" />{ds.rowCount.toLocaleString()} rows
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Columns3 className="w-3 h-3" />{ds.columns.length} cols
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500 uppercase font-mono">{ds.format}</span>
              </div>
            </div>
          </div>
          {isActive && <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />}
        </div>

        {ds.tags && ds.tags.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            <Tag className="w-3 h-3 text-gray-400" />
            {ds.tags.map(tag => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-md">{tag}</span>
            ))}
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-1">
          {ds.columns.slice(0, 12).map(col => (
            <span key={col} className="text-[10px] px-1.5 py-0.5 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded border border-gray-200 dark:border-gray-700 font-mono">{col}</span>
          ))}
          {ds.columns.length > 12 && (
            <span className="text-[10px] px-1.5 py-0.5 text-gray-400 dark:text-gray-500">+{ds.columns.length - 12} more</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="h-14 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl flex items-center px-6 shrink-0 z-10">
          <div className="w-10 lg:hidden" />
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-linear-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-50">Data Sources</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">{datasets.length} dataset{datasets.length !== 1 ? 's' : ''} available</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">

            {/* Preloaded */}
            {preloaded.length > 0 && (
              <section>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <HardDrive className="w-3.5 h-3.5" /> Preloaded Datasets
                </p>
                <div className="space-y-3">
                  {preloaded.map(ds => <DatasetCard key={ds.id} ds={ds} />)}
                </div>
              </section>
            )}

            {/* Cloud / MongoDB */}
            {cloud.length > 0 && (
              <section>
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Cloud className="w-3.5 h-3.5" /> Cloud Datasets
                </p>
                <div className="space-y-3">
                  {cloud.map(ds => <DatasetCard key={ds.id} ds={ds} />)}
                </div>
              </section>
            )}

            {/* Local uploads */}
            <section>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Laptop className="w-3.5 h-3.5" /> Local Uploads
              </p>
              {local.length > 0 && (
                <div className="space-y-3 mb-3">
                  {local.map(ds => <DatasetCard key={ds.id} ds={ds} />)}
                </div>
              )}
              <div className={`p-5 rounded-xl border-2 border-dashed transition-colors ${
                dataSource === 'local' && local.length === 0
                  ? 'border-violet-400 bg-violet-50/50 dark:bg-violet-950/20'
                  : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload a new dataset</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">CSV or JSON files — analyzed privately in your browser</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <DatasetUploader />
                    {uploadedRowCount > 0 && (
                      <button onClick={clearLocalData}
                        className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-950/30 px-3 py-1.5 rounded-lg transition-colors border border-red-200 dark:border-red-900">
                        <Trash2 className="w-3 h-3" /> Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}
