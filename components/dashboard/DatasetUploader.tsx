"use client";

import { useState } from "react";
import Papa from "papaparse";
import { UploadCloud, CheckCircle2, Loader2, X, FileSpreadsheet, Database } from "lucide-react";
import db from "@/lib/localDatabase";
import { useDashboardStore } from "@/store/useDashboardStore";

export function DatasetUploader() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [fileName, setFileName] = useState("");
  const [previewSchema, setPreviewSchema] = useState<string[]>([]);
  const [rowCount, setRowCount] = useState(0);

  const { setDataSource, setUploadedSchema, setActiveDatasetName, setUploadedRowCount, dataSource } = useDashboardStore();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setStatus("idle");
    setFileName(file.name);

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
            setStatus("success");
          }
        } catch {
          setStatus("error");
        } finally {
          setIsUploading(false);
        }
      };
      reader.onerror = () => { setStatus("error"); setIsUploading(false); };
      reader.readAsText(file);
      return;
    }

    // CSV
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          if (results.data.length > 0) {
            await db.uploadData(results.data as any[]);
            const schema = results.meta.fields || Object.keys(results.data[0] as any);
            setPreviewSchema(schema);
            setRowCount(results.data.length);
            setUploadedSchema(schema);
            setActiveDatasetName(file.name);
            setUploadedRowCount(results.data.length);
            setDataSource("local");
            setStatus("success");
          }
        } catch {
          setStatus("error");
        } finally {
          setIsUploading(false);
        }
      },
      error: () => { setStatus("error"); setIsUploading(false); },
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-xl transition-all shadow-sm ${
          dataSource === 'local'
            ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
            : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
      >
        <UploadCloud className="w-4 h-4" />
        <span>{dataSource === 'local' ? 'CSV Active' : 'Upload Data'}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-[440px] shadow-2xl relative border border-gray-200 dark:border-gray-800">
            <button
              onClick={() => { setIsOpen(false); setStatus("idle"); setPreviewSchema([]); }}
              className="absolute right-4 top-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-violet-600 rounded-xl flex items-center justify-center">
                  <Database className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50">Upload Dataset</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">CSV or JSON files supported</p>
                </div>
              </div>

              <label className={`
                mt-5 flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-all
                ${status === 'success' ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20' :
                  status === 'error' ? 'border-red-400 bg-red-50 dark:bg-red-950/20' :
                  'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-300'}
              `}>
                <div className="flex flex-col items-center">
                  {isUploading ? (
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                  ) : status === "success" ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
                  ) : (
                    <UploadCloud className={`w-8 h-8 mb-2 ${status === 'error' ? 'text-red-400' : 'text-gray-400'}`} />
                  )}
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {isUploading ? "Parsing..." :
                     status === "success" ? `${fileName} uploaded!` :
                     status === "error" ? "Upload failed. Try again." :
                     "Click to upload or drag & drop"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">CSV, JSON — max 50,000 rows</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".csv,.json"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </label>

              {/* Schema preview */}
              {previewSchema.length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Schema Detected</span>
                    </div>
                    <span className="text-xs text-gray-400">{rowCount.toLocaleString()} rows</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {previewSchema.map((col) => (
                      <span key={col} className="text-[11px] px-2 py-0.5 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md border border-gray-200 dark:border-gray-600 font-mono">
                        {col}
                      </span>
                    ))}
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
