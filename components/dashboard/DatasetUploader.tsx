"use client";

import { useState } from "react";
import Papa from "papaparse";
import { UploadCloud, CheckCircle2, Loader2, X, FileSpreadsheet, Database, HardDrive, Tag, Rows3, Columns3, Clock } from "lucide-react";
import db from "@/lib/localDatabase";
import { useDashboardStore } from "@/store/useDashboardStore";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function DatasetUploader() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [fileName, setFileName] = useState("");
  const [previewSchema, setPreviewSchema] = useState<string[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [fileSize, setFileSize] = useState(0);
  const [storageMode, setStorageMode] = useState<'local' | 'cloud'>('local');
  const [collectionName, setCollectionName] = useState("");
  const [cloudUploadError, setCloudUploadError] = useState<string | null>(null);

  const { setDataSource, setUploadedSchema, setActiveDatasetName, setUploadedRowCount, dataSource, addDataset, setActiveDatasetId, setMongoCollection } = useDashboardStore();

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
            const schema = Object.keys(data[0]);

            if (storageMode === 'cloud') {
              const safeName = (collectionName.trim() ||
                file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_')
              ).slice(0, 64);
              setCollectionName(safeName);
              setCloudUploadError(null);
              const resp = await fetch('/api/upload-dataset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ collectionName: safeName, data }),
              });
              const cloudResult = await resp.json();
              if (!cloudResult.success) {
                setCloudUploadError(cloudResult.error || 'MongoDB upload failed');
                setStatus('error');
                return;
              }
              const savedSchema = cloudResult.schema || schema;
              setPreviewSchema(savedSchema);
              setRowCount(data.length);
              setUploadedSchema(savedSchema);
              setActiveDatasetName(file.name);
              setUploadedRowCount(data.length);
              setDataSource('mongodb');
              setMongoCollection(cloudResult.collectionName);
              addDataset({
                id: cloudResult.collectionName,
                name: file.name,
                type: 'cloud',
                format: 'mongodb',
                rowCount: data.length,
                columns: savedSchema,
                sizeKB: Math.round(file.size / 1024),
                uploadedAt: Date.now(),
                tags: detectTags(savedSchema),
                collectionName: cloudResult.collectionName,
              });
              setActiveDatasetId(cloudResult.collectionName);
            } else {
              await db.uploadData(data);
              setPreviewSchema(schema);
              setRowCount(data.length);
              setUploadedSchema(schema);
              setActiveDatasetName(file.name);
              setUploadedRowCount(data.length);
              setDataSource('local');
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
            }
            setStatus('success');
          }
        } catch { setStatus("error"); }
        finally { setIsUploading(false); }
      };
      reader.onerror = () => { setStatus("error"); setIsUploading(false); };
      reader.readAsText(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const rawText = String(ev.target?.result || "");
        const cleanedText = sanitizeCsvText(rawText);

        Papa.parse(cleanedText, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: "greedy",
          transformHeader: (h) => h.trim(),
          transform: (value) => (typeof value === "string" ? value.trim() : value),
          complete: async (results) => {
            try {
              const parsedRows = (results.data as Record<string, unknown>[])
                .filter((row) => row && typeof row === "object")
                .filter((row) => {
                  const vals = Object.values(row);
                  return vals.some((v) => v !== null && v !== undefined && String(v).trim() !== "");
                });

              const schema = (results.meta.fields || Object.keys(parsedRows[0] || {})).map((c) => c.trim());

              // Remove malformed rows that don't align with schema (common with corrupted tails)
              const validRows = parsedRows.filter((row) => {
                const present = schema.filter((k) => Object.prototype.hasOwnProperty.call(row, k)).length;
                return present >= Math.max(2, Math.floor(schema.length * 0.5));
              });

              if (validRows.length === 0 || schema.length === 0) {
                setStatus("error");
                return;
              }

              if (storageMode === 'cloud') {
                const safeName = (collectionName.trim() ||
                  file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_')
                ).slice(0, 64);
                setCollectionName(safeName);
                setCloudUploadError(null);
                const resp = await fetch('/api/upload-dataset', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ collectionName: safeName, data: validRows }),
                });
                const cloudResult = await resp.json();
                if (!cloudResult.success) {
                  setCloudUploadError(cloudResult.error || 'MongoDB upload failed');
                  setStatus('error');
                  return;
                }
                const savedSchema = cloudResult.schema || schema;
                setPreviewSchema(savedSchema);
                setRowCount(validRows.length);
                setUploadedSchema(savedSchema);
                setActiveDatasetName(file.name);
                setUploadedRowCount(validRows.length);
                setDataSource('mongodb');
                setMongoCollection(cloudResult.collectionName);
                addDataset({
                  id: cloudResult.collectionName,
                  name: file.name,
                  type: 'cloud',
                  format: 'mongodb',
                  rowCount: validRows.length,
                  columns: savedSchema,
                  sizeKB: Math.round(file.size / 1024),
                  uploadedAt: Date.now(),
                  tags: detectTags(savedSchema),
                  collectionName: cloudResult.collectionName,
                });
                setActiveDatasetId(cloudResult.collectionName);
              } else {
                await db.uploadData(validRows);
                setPreviewSchema(schema);
                setRowCount(validRows.length);
                setUploadedSchema(schema);
                setActiveDatasetName(file.name);
                setUploadedRowCount(validRows.length);
                setDataSource('local');
                const dsId = `local-${Date.now()}`;
                addDataset({
                  id: dsId,
                  name: file.name,
                  type: storageMode,
                  format: 'csv',
                  rowCount: validRows.length,
                  columns: schema,
                  sizeKB: Math.round(file.size / 1024),
                  uploadedAt: Date.now(),
                  tags: detectTags(schema),
                });
                setActiveDatasetId(dsId);
              }
              setStatus('success');
            } catch {
              setStatus("error");
            } finally {
              setIsUploading(false);
            }
          },
          error: () => {
            setStatus("error");
            setIsUploading(false);
          },
        });
      } catch {
        setStatus("error");
        setIsUploading(false);
      }
    };

    reader.onerror = () => {
      setStatus("error");
      setIsUploading(false);
    };

    reader.readAsText(file);
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

      <Dialog
        open={isOpen}
        onOpenChange={(open) => {
          if (open) {
            setIsOpen(true);
            return;
          }
          handleClose();
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="w-120 max-w-[calc(100%-2rem)] max-h-[90vh] overflow-auto rounded-2xl bg-white p-0 shadow-2xl border border-gray-200 dark:border-gray-800 dark:bg-gray-900"
        >
          <button onClick={handleClose}
            className="absolute right-4 top-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10">
            <X className="w-4 h-4" />
          </button>

          <div className="p-6">
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-linear-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center">
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
                  <button onClick={() => setStorageMode('cloud')}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all ${
                      storageMode === 'cloud' ? 'border-violet-400 bg-violet-50 dark:bg-violet-950/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}>
                    <Database className={`w-4 h-4 ${storageMode === 'cloud' ? 'text-violet-600' : 'text-gray-400'}`} />
                    <div className="text-left">
                      <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">Cloud (MongoDB)</p>
                      <p className="text-[10px] text-gray-400">Persistent storage</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Collection name — only shown for cloud mode */}
              {storageMode === 'cloud' && (
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
                    MongoDB Collection Name
                  </label>
                  <input
                    type="text"
                    value={collectionName}
                    onChange={(e) =>
                      setCollectionName(
                        e.target.value.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64)
                      )
                    }
                    placeholder="e.g. my_sales_data"
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-400 dark:focus:ring-violet-600"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Leave blank to auto-generate from filename. Letters, numbers, _ and - only.
                  </p>
                  {cloudUploadError && (
                    <p className="text-xs text-red-500 mt-1.5 font-medium">{cloudUploadError}</p>
                  )}
                </div>
              )}

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
                    {isUploading
                      ? storageMode === 'cloud' ? 'Saving to MongoDB…' : 'Parsing…'
                      : status === 'success' ? `${fileName} uploaded!`
                      : status === 'error' ? 'Upload failed. Try again.'
                      : 'Click to upload or drag & drop'}
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
        </DialogContent>
      </Dialog>
    </>
  );
}

function sanitizeCsvText(raw: string): string {
  let text = raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Cut off known corruption tails seen in downloaded/pasted CSV files
  const cutMarkers = ["</pre>", "</body>", "</html>", "X-Goog-Algorithm=", "PK\u0003\u0004"];
  const cutPoints = cutMarkers
    .map((m) => text.indexOf(m))
    .filter((idx) => idx >= 0);

  if (cutPoints.length > 0) {
    text = text.slice(0, Math.min(...cutPoints));
  }

  // Strip null bytes and other control chars except tab/newline
  text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");

  // Keep only rows that look like CSV rows with at least one comma
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .filter((l) => l.includes(","));

  if (lines.length === 0) return "";

  const header = lines[0];
  const expectedCols = header.split(",").length;

  const cleanedLines = [
    header,
    ...lines.slice(1).filter((line) => {
      const cols = line.split(",").length;
      return cols >= Math.max(2, expectedCols - 3);
    }),
  ];

  return cleanedLines.join("\n");
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
