"use client";

import { useState } from "react";
import Papa from "papaparse";
import { UploadCloud, CheckCircle2, Loader2, X } from "lucide-react";
import db from "@/lib/localDatabase";
import { useDashboardStore } from "@/store/useDashboardStore";

export function DatasetUploader() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const { setDataSource } = useDashboardStore();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setStatus("idle");

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          if (results.data.length > 0) {
            await db.uploadData(results.data);
            setStatus("success");
            setDataSource("local");
            setTimeout(() => {
              setIsOpen(false);
              setStatus("idle");
            }, 2000);
          }
        } catch (err) {
          setStatus("error");
          console.error(err);
        } finally {
          setIsUploading(false);
        }
      },
      error: () => {
        setStatus("error");
        setIsUploading(false);
      }
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
      >
        <UploadCloud className="w-4 h-4" />
        <span>Upload Data</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-[400px] shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-2 text-gray-900">Upload Dataset</h2>
              <p className="text-sm text-gray-500 mb-6">Drag and drop a CSV file or click to browse.</p>

              <label className={`
                flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer
                transition-colors
                ${status === 'success' ? 'border-green-400 bg-green-50' : 
                  status === 'error' ? 'border-red-400 bg-red-50' : 
                  'border-blue-300 bg-blue-50/50 hover:bg-blue-50'}
              `}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {isUploading ? (
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
                  ) : status === 'success' ? (
                    <CheckCircle2 className="w-10 h-10 text-green-500 mb-3" />
                  ) : (
                    <UploadCloud className={`w-10 h-10 mb-3 ${status === 'error' ? 'text-red-400' : 'text-blue-500'}`} />
                  )}
                  <p className="text-sm font-medium text-gray-700">
                    {isUploading ? "Uploading & parsing..." : 
                     status === 'success' ? "Uploaded successfully!" : 
                     status === 'error' ? "Upload failed. Try again." : 
                     "Click to upload CSV"}
                  </p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".csv"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </label>

              <div className="mt-4 text-xs text-gray-400 text-center">
                Supported formats: CSV. Max 50,000 rows recommended for browser performance.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
