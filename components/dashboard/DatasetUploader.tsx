"use client";

import { useState } from "react";
import Papa from "papaparse";
import { UploadCloud, CheckCircle2, Loader2, X, FileSpreadsheet, Database, HardDrive, Tag, Rows3, Columns3, Clock } from "lucide-react";
import db from "@/lib/localDatabase";
import { useDashboardStore } from "@/store/useDashboardStore";

export function DatasetUploader() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [fileName, setFileName] = useState("");
  const [previewSchema, setPreviewSchema] = useState<string[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [fileSize, setFileSize] = useState(0);
  const [storageMode, setStorageMode] = useState<'local' | 'cloud'>('local');

  const { setDataSource, setUploadedSchema, setActiveDatasetName, setUploadedRowCount, dataSource, addDataset, setActiveDatasetId } = useDashboardStore();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setStatus("idle");
    setFileName(file.name);
    setFileSize(Math.round(file.size / 1024));

    const isJSON = file.name.endsWith(".json");

    if (isJSON) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const json = JSON.parse(ev.target?.result as string);
          const data = Array.isArray(json) ? json : [json];
          if (data.length > 0) {
            await db.uploadData(data);
            const schema = Object.keys(data[0]);
            setPreviewSchema(schema);
            setRowCount(data.length);
            setUploadedSchema(schema);
            setActiveDatasetName(file.name);
            setUploadedRowCount(data.length);
            setDataSource("local");

            const dsId = `local-${Date.now()}`;
            addDataset({
              id: dsId,
              name: file.name,
              type: storageMode,
              format: 'json',
              rowCount: data.length,
              columns: schema,
              sizeKB: Math.round(file.size / 1024),
              uploadedAt: Date.now(),
              tags: detectTags(schema),
            });
            setActiveDatasetId(dsId);
            setStatus("success");
          }
        } catch { setStatus("error"); }
        finally { setIsUploading(false); }
      };
      reader.onerror = () => { setStatus("error"); setIsUploading(false); };
      reader.readAsText(file);
      return;
    }

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          if (results.data.length > 0) {
            await db.uploadData(results.data as Record<string, unknown>[]);
            const schema = results.meta.fields || Object.keys(results.data[0] as Record<string, unknown>);
            setPreviewSchema(schema);
            setRowCount(results.data.length);
            setUploadedSchema(schema);
            setActiveDatasetName(file.name);
            setUploadedRowCount(results.data.length);
            setDataSource("local");

            const dsId = `local-${Date.now()}`;
            addDataset({
              id: dsId,
              name: file.name,
              type: storageMode,
              format: 'csv',
              rowCount: results.data.length,
              columns: schema,
              sizeKB: Math.round(file.size / 1024),
              uploadedAt: Date.now(),
              tags: detectTags(schema),
            });
            setActiveDatasetId(dsId);
            setStatus("success");
          }
        } catch { setStatus("error"); }
        finally { setIsUploading(false); }
      },
      error: () => { setStatus("error"); setIsUploading(false); },
    });
  };

  const handleClose = () => {
    setIsOpen(false);
    setStatus("idle");
    setPreviewSchema([]);
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)}
        className={`flex items-center space-x-2 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
          dataSource === 'local'
            ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
            : 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}>
        <UploadCloud className="w-3.5 h-3.5" />
        <span>{dataSource === 'local' ? 'CSV Active' : 'Upload'}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-[480px] shadow-2xl relative border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-auto">
            <button onClick={handleClose}
              className="absolute right-4 top-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10">
              <X className="w-4 h-4" />
            </button>

            <div className="p-6">
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center">
                  <Database className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50">Upload Dataset</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">CSV or JSON files · Max 50,000 rows</p>
                </div>
              </div>

              {/* Storage mode selector */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">Storage Mode</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setStorageMode('local')}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all ${
                      storageMode === 'local' ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}>
                    <HardDrive className={`w-4 h-4 ${storageMode === 'local' ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <div className="text-left">
                      <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">Local (Incognito)</p>
                      <p className="text-[10px] text-gray-400">Data stays in browser</p>
                    </div>
                  </button>
                  <button
                    className="flex items-center gap-2.5 p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed relative">
                    <Database className="w-4 h-4 text-gray-400" />
                    <div className="text-left">
                      <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">Cloud (MongoDB)</p>
                      <p className="text-[10px] text-gray-400">Persistent storage</p>
                    </div>
                    <span className="absolute top-1 right-1 text-[8px] bg-violet-100 dark:bg-violet-900/30 text-violet-600 px-1.5 py-0.5 rounded-md font-bold">SOON</span>
                  </button>
                </div>
              </div>

              {/* Drop zone */}
              <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                status === 'success' ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20' :
                status === 'error' ? 'border-red-400 bg-red-50 dark:bg-red-950/20' :
                'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:border-indigo-300'
              }`}>
                <div className="flex flex-col items-center">
                  {isUploading ? <Loader2 className="w-7 h-7 text-indigo-500 animate-spin mb-2" /> :
                   status === "success" ? <CheckCircle2 className="w-7 h-7 text-emerald-500 mb-2" /> :
                   <UploadCloud className={`w-7 h-7 mb-2 ${status === 'error' ? 'text-red-400' : 'text-gray-400'}`} />}
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {isUploading ? "Parsing..." : status === "success" ? `${fileName} uploaded!` : status === "error" ? "Upload failed. Try again." : "Click to upload or drag & drop"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">CSV, JSON — max 50,000 rows</p>
                </div>
                <input type="file" className="hidden" accept=".csv,.json" onChange={handleFileUpload} disabled={isUploading} />
              </label>

              {/* Dataset card after upload */}
              {previewSchema.length > 0 && status === 'success' && (
                <div className="mt-5 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{fileName}</h4>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 px-1.5 py-0.5 rounded uppercase font-bold">
                          {fileName.split('.').pop()?.toUpperCase()}
                        </span>
                        <span className="text-[10px] text-gray-400">{storageMode === 'local' ? 'Incognito' : 'Cloud'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="flex items-center gap-1.5 p-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700">
                      <Rows3 className="w-3.5 h-3.5 text-blue-500" />
                      <div>
                        <p className="text-[10px] text-gray-400">Rows</p>
                        <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{rowCount.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700">
                      <Columns3 className="w-3.5 h-3.5 text-violet-500" />
                      <div>
                        <p className="text-[10px] text-gray-400">Columns</p>
                        <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{previewSchema.length}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700">
                      <HardDrive className="w-3.5 h-3.5 text-emerald-500" />
                      <div>
                        <p className="text-[10px] text-gray-400">Size</p>
                        <p className="text-xs font-bold text-gray-900 dark:text-gray-100">{fileSize}KB</p>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center gap-1.5 mb-3">
                    <Tag className="w-3 h-3 text-gray-400" />
                    <div className="flex flex-wrap gap-1">
                      {detectTags(previewSchema).map(tag => (
                        <span key={tag} className="text-[10px] bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md font-medium">{tag}</span>
                      ))}
                    </div>
                  </div>

                  {/* Columns */}
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1.5">Schema</p>
                    <div className="flex flex-wrap gap-1.5">
                      {previewSchema.map((col) => (
                        <span key={col} className="text-[11px] px-2 py-0.5 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md border border-gray-200 dark:border-gray-600 font-mono">{col}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function detectTags(schema: string[]): string[] {
  const tags: string[] = [];
  const s = schema.map(c => c.toLowerCase());
  if (s.some(c => c.includes('revenue') || c.includes('sales') || c.includes('price'))) tags.push('Revenue');
  if (s.some(c => c.includes('date') || c.includes('time') || c.includes('month'))) tags.push('Time Series');
  if (s.some(c => c.includes('region') || c.includes('country') || c.includes('city'))) tags.push('Geographic');
  if (s.some(c => c.includes('product') || c.includes('item') || c.includes('sku'))) tags.push('Product');
  if (s.some(c => c.includes('customer') || c.includes('user') || c.includes('client'))) tags.push('Customer');
  if (s.some(c => c.includes('cost') || c.includes('expense'))) tags.push('Financial');
  if (tags.length === 0) tags.push('General');
  return tags;
}
