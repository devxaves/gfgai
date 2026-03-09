"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { Sidebar } from "@/components/layout/Sidebar";
import { QueryInput } from "@/components/dashboard/QueryInput";
import { Workspace } from "@/components/dashboard/Workspace";
import { DatasetUploader } from "@/components/dashboard/DatasetUploader";
import { DataSourceSelector } from "@/components/dashboard/DataSourceSelector";
import { ChatPanel } from "@/components/dashboard/ChatPanel";
import { ChatToggleButton } from "@/components/dashboard/ChatToggleButton";
import { CompareWorkspace } from "@/components/dashboard/CompareWorkspace";
import { ArrowLeftRight } from "lucide-react";
import { useDashboardStore } from "@/store/useDashboardStore";

export default function Dashboard() {
  const { isAuthenticated, isDemoUser, isLoading, checkAuth } = useAuthStore();
  const { compareMode, setCompareMode, components } = useDashboardStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if not authenticated and not demo user
  if (!isAuthenticated && !isDemoUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-gray-950">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Unlock Full Potential
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Sign in to access advanced analytics, save your queries, and get
              personalized insights with Viz.ai.
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => (window.location.href = "/auth")}
              className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/25 transform hover:scale-105"
            >
              Sign In for More Benefits
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="w-full px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium rounded-lg transition-colors duration-300"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show dashboard if authenticated or demo
  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl shrink-0 z-10">
          {/* Data source selector row */}
          <div className="flex items-center justify-center gap-2 px-4 lg:px-6 py-1.5 border-b border-gray-100 dark:border-gray-800/50">
            <DataSourceSelector />
          </div>
          {/* Query input row */}
          <div className="flex items-center px-4 lg:px-6 py-2 gap-3">
            <div className="w-10 lg:hidden" />
            <div className="flex-1 flex justify-center">
              <QueryInput />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Compare Toggle */}
              {components.length > 0 && (
                <button
                  onClick={() => setCompareMode(!compareMode)}
                  className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all ${
                    compareMode
                      ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-violet-50 dark:hover:bg-violet-950/20 hover:text-violet-600'
                  }`}
                  title="Compare dashboards side by side"
                >
                  <ArrowLeftRight className="w-3 h-3" />
                  Compare
                </button>
              )}
              <DatasetUploader />
              <ChatToggleButton />
            </div>
          </div>
        </header>
        <div className="flex flex-1 overflow-hidden">
          {compareMode ? (
            <div className="flex-1 overflow-hidden">
              <CompareWorkspace />
            </div>
          ) : (
            <main className="flex-1 overflow-auto p-4 lg:p-6">
              <Workspace />
            </main>
          )}
          {!compareMode && <ChatPanel />}
        </div>
      </div>
    </div>
  );
}
