"use client";

import { useState, useRef, useEffect } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { Database, ChevronDown, HardDrive, Cloud, Laptop, Check, FileSpreadsheet, X } from "lucide-react";

export function DataSourceSelector() {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { datasets, activeDatasetId, setActiveDatasetId, setDataSource, setActiveDatasetName, setUploadedSchema, setMongoCollection } = useDashboardStore();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Seed demo MongoDB datasets once per browser session (idempotent on the server)
  useEffect(() => {
    if (typeof window !== 'undefined' && !sessionStorage.getItem('vizlyai-demo-seeded')) {
      sessionStorage.setItem('vizlyai-demo-seeded', '1');
      fetch('/api/seed-demo-datasets', { method: 'POST' }).catch(() => {});
    }
  }, []);

  const activeDataset = datasets.find(d => d.id === activeDatasetId);

  const handleSelect = (dataset: typeof datasets[0]) => {
    setActiveDatasetId(dataset.id);
    setActiveDatasetName(dataset.name);
    if (dataset.type === 'preloaded') {
      setDataSource('server');
      setUploadedSchema([]);
    } else if (dataset.type === 'cloud') {
      setDataSource('mongodb');
      setUploadedSchema(dataset.columns);
      // For cloud datasets, id === collectionName
      setMongoCollection(dataset.id);
    } else {
      setDataSource('local');
      setUploadedSchema(dataset.columns);
    }
    setOpen(false);
  };

  const preloaded = datasets.filter(d => d.type === 'preloaded');
  const local = datasets.filter(d => d.type === 'local');
  const cloud = datasets.filter(d => d.type === 'cloud');

  const TypeIcon = { preloaded: HardDrive, local: Laptop, cloud: Cloud };
  const TypeColor = { preloaded: 'text-indigo-500', local: 'text-emerald-500', cloud: 'text-violet-500' };
  const TypeBg = { preloaded: 'bg-indigo-50 dark:bg-indigo-950/30', local: 'bg-emerald-50 dark:bg-emerald-950/30', cloud: 'bg-violet-50 dark:bg-violet-950/30' };

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Database className="w-3.5 h-3.5 text-indigo-500" />
        <span className="text-gray-700 dark:text-gray-300 max-w-[120px] truncate">{activeDataset?.name || 'Select Data'}</span>
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden">
          {/* Preloaded */}
          <div className="p-2">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold px-2 mb-1">Preloaded Datasets</p>
            {preloaded.map(ds => (
              <DatasetCard key={ds.id} dataset={ds} isActive={ds.id === activeDatasetId} onClick={() => handleSelect(ds)} TypeIcon={TypeIcon} TypeColor={TypeColor} TypeBg={TypeBg} />
            ))}
          </div>

          {/* Local */}
          <div className="p-2 border-t border-gray-100 dark:border-gray-800">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold px-2 mb-1">Local (Incognito)</p>
            {local.length > 0 ? local.map(ds => (
              <DatasetCard key={ds.id} dataset={ds} isActive={ds.id === activeDatasetId} onClick={() => handleSelect(ds)} TypeIcon={TypeIcon} TypeColor={TypeColor} TypeBg={TypeBg} />
            )) : (
              <p className="text-xs text-gray-400 px-2 py-1.5">Upload a CSV to use in incognito mode</p>
            )}
          </div>

          {/* Cloud */}
          <div className="p-2 border-t border-gray-100 dark:border-gray-800">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold px-2 mb-1">Cloud Storage</p>
            {cloud.length > 0 ? cloud.map(ds => (
              <DatasetCard key={ds.id} dataset={ds} isActive={ds.id === activeDatasetId} onClick={() => handleSelect(ds)} TypeIcon={TypeIcon} TypeColor={TypeColor} TypeBg={TypeBg} />
            )) : (
              <p className="text-xs text-gray-400 px-2 py-1.5">Upload a file with Cloud (MongoDB) mode to see it here</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DatasetCard({
  dataset,
  isActive,
  onClick,
  TypeIcon,
  TypeColor,
  TypeBg,
}: {
  dataset: { id: string; name: string; type: string; format: string; rowCount: number; columns: string[]; sizeKB?: number; tags?: string[] };
  isActive: boolean;
  onClick: () => void;
  TypeIcon: Record<string, typeof HardDrive>;
  TypeColor: Record<string, string>;
  TypeBg: Record<string, string>;
}) {
  const Icon = TypeIcon[dataset.type] || FileSpreadsheet;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg transition-all text-left ${
        isActive ? 'bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${TypeBg[dataset.type] || ''}`}>
        <Icon className={`w-4 h-4 ${TypeColor[dataset.type] || 'text-gray-400'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">{dataset.name}</span>
          {isActive && <Check className="w-3 h-3 text-indigo-600 shrink-0" />}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-gray-400">{dataset.rowCount.toLocaleString()} rows</span>
          <span className="text-[10px] text-gray-400">· {dataset.columns.length} cols</span>
          {dataset.sizeKB && <span className="text-[10px] text-gray-400">· {dataset.sizeKB}KB</span>}
          <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-1 py-0.5 rounded uppercase">{dataset.format}</span>
        </div>
        {dataset.tags && dataset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {dataset.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded-md">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}
