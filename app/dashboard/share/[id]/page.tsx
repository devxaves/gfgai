"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DynamicChart } from "@/components/charts/DynamicChart";
import { KPICard } from "@/components/charts/KPICard";
import { Sparkles, ExternalLink, Loader2, AlertCircle, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import type { DashboardMetric, DashboardChart, ChartType } from "@/types";

interface SharedData {
  shareId: string;
  query: string;
  metrics: DashboardMetric[];
  charts: DashboardChart[];
  summary: string;
  narrative: string;
  datasetName: string;
  createdAt: string;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
};

export default function SharedDashboardPage() {
  const params = useParams();
  const shareId = params.id as string;
  const [data, setData] = useState<SharedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shareId) return;
    (async () => {
      try {
        const res = await fetch(`/api/share-dashboard/${shareId}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || "Dashboard not found.");
        }
      } catch {
        setError("Failed to load shared dashboard.");
      } finally {
        setLoading(false);
      }
    })();
  }, [shareId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading shared dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-14 h-14 bg-red-100 dark:bg-red-950/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-2">Dashboard Not Found</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {error || "This shared dashboard may have expired or doesn't exist."}
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Create Your Own Dashboard
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  const createdDate = new Date(data.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-xl flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-gray-900 dark:text-gray-50 truncate">
                {data.query}
              </h1>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">
                Shared via Viz.ai • {createdDate}
                {data.datasetName && ` • ${data.datasetName}`}
              </p>
            </div>
          </div>
          <a
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors shrink-0"
          >
            Create Your Own
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </header>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-5">
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
          {/* KPI Cards */}
          {data.metrics.length > 0 && (
            <motion.div variants={item} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {data.metrics.map((metric, idx) => (
                <KPICard key={idx} {...metric} index={idx} />
              ))}
            </motion.div>
          )}

          {/* Charts */}
          <motion.div
            variants={item}
            className={`grid grid-cols-1 ${data.charts.length > 1 ? "lg:grid-cols-2" : ""} gap-5`}
          >
            {data.charts.map((chart) => (
              <motion.div
                key={chart.id}
                variants={item}
                className="p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col min-h-90"
              >
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate">
                    {chart.title}
                  </h3>
                  {chart.subtitle && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{chart.subtitle}</p>
                  )}
                </div>
                <div className="flex-1 min-h-0">
                  <DynamicChart
                    type={chart.type as ChartType}
                    data={chart.data}
                    xAxisKey={chart.xAxisKey}
                    series={chart.series}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* AI Narrative */}
          {(data.narrative || data.summary) && (
            <motion.div
              variants={item}
              className="p-5 bg-linear-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
                    AI Insight
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {data.narrative || data.summary}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Footer CTA */}
        <div className="text-center py-8 border-t border-gray-100 dark:border-gray-800 mt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Want to explore this data further?
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-indigo-500 hover:to-cyan-500 transition-all hover:shadow-lg hover:shadow-indigo-500/25"
          >
            <Sparkles className="w-4 h-4" />
            Create Your Own Dashboard
          </a>
          <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-2">
            Powered by Viz.ai — Conversational AI for Business Intelligence
          </p>
        </div>
      </main>
    </div>
  );
}
