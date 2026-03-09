"use client";

import { useState, useCallback } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { DynamicChart } from "@/components/charts/DynamicChart";
import { KPICard } from "@/components/charts/KPICard";
import { SkeletonDashboard } from "@/components/dashboard/SkeletonDashboard";
import { Group, Panel, Separator } from "react-resizable-panels";
import {
  Send,
  Loader2,
  Sparkles,
  X,
  GripVertical,
  ArrowLeftRight,
} from "lucide-react";
import { motion } from "framer-motion";
import type { DashboardChart, DashboardMetric, ChartType } from "@/types";

const item = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] },
  },
};

function DashboardPanel({
  label,
  query,
  metrics,
  charts,
  summary,
  narrative,
  isQuerying,
  isEmpty,
}: {
  label: string;
  query: string;
  metrics: DashboardMetric[];
  charts: DashboardChart[];
  summary: string;
  narrative: string;
  isQuerying: boolean;
  isEmpty: boolean;
}) {
  return (
    <div className="h-full overflow-auto p-4 space-y-4">
      {/* Panel header */}
      <div className="flex items-center gap-2">
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
            label === "A"
              ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600"
              : "bg-violet-100 dark:bg-violet-900/30 text-violet-600"
          }`}
        >
          {label}
        </span>
        {query && (
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate">
            {query}
          </span>
        )}
      </div>

      {isQuerying && <SkeletonDashboard />}

      {!isQuerying && isEmpty && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ArrowLeftRight className="w-8 h-8 text-gray-300 dark:text-gray-700 mb-3" />
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {label === "A" ? "Run a query on the main dashboard first" : "Enter a comparison query below"}
          </p>
        </div>
      )}

      {!isQuerying && !isEmpty && (
        <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }} className="space-y-4">
          {/* KPIs */}
          {metrics.length > 0 && (
            <motion.div variants={item} className="grid grid-cols-2 gap-2">
              {metrics.map((metric, idx) => (
                <KPICard key={idx} {...metric} index={idx} />
              ))}
            </motion.div>
          )}

          {/* Charts */}
          {charts.map((chart) => (
            <motion.div
              key={chart.id}
              variants={item}
              className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 min-h-60"
            >
              <h3 className="text-xs font-semibold text-gray-900 dark:text-gray-50 mb-2 truncate">
                {chart.title}
              </h3>
              <div className="h-52">
                <DynamicChart
                  type={chart.type as ChartType}
                  data={chart.data}
                  xAxisKey={chart.xAxisKey}
                  series={chart.series}
                />
              </div>
            </motion.div>
          ))}

          {/* Narrative */}
          {(narrative || summary) && (
            <motion.div
              variants={item}
              className="p-4 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30"
            >
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  {narrative || summary}
                </p>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}

export function CompareWorkspace() {
  const {
    // Primary dashboard data
    currentQuery,
    metrics,
    components,
    summary,
    narrative,
    isQuerying,
    // Compare data
    compareQuery,
    compareMetrics,
    compareComponents,
    compareSummary,
    compareNarrative,
    compareIsQuerying,
    // Actions
    resetCompare,
    setCompareQuery,
    setCompareDashboardData,
    setCompareIsQuerying,
    // Context
    dataSource,
    uploadedSchema,
    conversationHistory,
    activeDatasetId,
    mongoCollection,
  } = useDashboardStore();

  const [inputQuery, setInputQuery] = useState("");

  const handleCompareQuery = useCallback(async () => {
    if (!inputQuery.trim() || compareIsQuerying) return;

    setCompareQuery(inputQuery);
    setCompareIsQuerying(true);

    try {
      const chatHistory = conversationHistory.slice(-3).flatMap((c) => [
        { role: "user", content: c.query },
        {
          role: "assistant",
          content: c.dashboard
            ? `Generated dashboard: ${c.dashboard.summary || c.query}`
            : "Error",
        },
      ]);

      const schema =
        dataSource === "local" && uploadedSchema.length > 0
          ? uploadedSchema
          : [];

      const res = await fetch("/api/analyze-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: inputQuery,
          requestType: "dashboard",
          dataSource,
          activeDatasetId,
          conversationHistory: chatHistory,
          localSchema: schema,
          mongoCollection:
            dataSource === "mongodb" ? mongoCollection : undefined,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setCompareDashboardData([], [], json.error || "Failed", "");
        return;
      }

      if (json.mode === "cannotAnswer" || json.mode === "clarification") {
        setCompareDashboardData(
          [],
          [],
          json.reason || json.clarification || "Cannot answer",
          ""
        );
        return;
      }

      const m: DashboardMetric[] = json.data?.metrics || [];
      const c: DashboardChart[] = json.data?.charts || [];
      const s = json.data?.summary || "";
      setCompareDashboardData(m, c, s, s);
    } catch {
      setCompareDashboardData([], [], "An error occurred", "");
    }

    setInputQuery("");
  }, [
    inputQuery,
    compareIsQuerying,
    dataSource,
    uploadedSchema,
    conversationHistory,
    activeDatasetId,
    mongoCollection,
    setCompareQuery,
    setCompareIsQuerying,
    setCompareDashboardData,
  ]);

  return (
    <div className="flex flex-col h-full">
      {/* Compare header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-950/50 shrink-0">
        <div className="flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">
            Compare Mode
          </span>
          <span className="text-[9px] bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wide">
            BETA
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Comparison query input */}
          <div className="flex items-center gap-1.5">
            <input
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCompareQuery();
                }
              }}
              placeholder="Enter comparison query..."
              className="w-64 text-xs px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500/30 placeholder:text-gray-400"
              disabled={compareIsQuerying}
            />
            <button
              onClick={handleCompareQuery}
              disabled={compareIsQuerying || !inputQuery.trim()}
              className="p-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 transition-all"
            >
              {compareIsQuerying ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <button
            onClick={resetCompare}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-3 h-3" />
            Exit
          </button>
        </div>
      </div>

      {/* Split panels */}
      <div className="flex-1 overflow-hidden">
        <Group orientation="horizontal">
          <Panel defaultSize={50} minSize={30}>
            <DashboardPanel
              label="A"
              query={currentQuery}
              metrics={metrics}
              charts={components}
              summary={summary}
              narrative={narrative}
              isQuerying={isQuerying}
              isEmpty={components.length === 0 && metrics.length === 0}
            />
          </Panel>

          <Separator className="w-2 bg-gray-100 dark:bg-gray-800 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors flex items-center justify-center cursor-col-resize group">
            <GripVertical className="w-3 h-3 text-gray-400 group-hover:text-indigo-500 transition-colors" />
          </Separator>

          <Panel defaultSize={50} minSize={30}>
            <DashboardPanel
              label="B"
              query={compareQuery}
              metrics={compareMetrics}
              charts={compareComponents}
              summary={compareSummary}
              narrative={compareNarrative}
              isQuerying={compareIsQuerying}
              isEmpty={
                compareComponents.length === 0 && compareMetrics.length === 0
              }
            />
          </Panel>
        </Group>
      </div>
    </div>
  );
}
