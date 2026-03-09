"use client";

import { useDashboardStore } from "@/store/useDashboardStore";
import { KPICard } from "@/components/charts/KPICard";
import { DynamicChart } from "@/components/charts/DynamicChart";
import { SkeletonDashboard } from "@/components/dashboard/SkeletonDashboard";
import { ErrorCard } from "@/components/dashboard/ErrorCard";
import {
  ExecutedQueryViewer,
  EXAMPLE_PROMPTS,
} from "@/components/dashboard/QueryInput";
import {
  executeLocalQuery,
  getLocalSchema,
  getLocalData,
  evaluateLocalMetricExpression,
  formatLocalMetricValue,
} from "@/lib/localQueryEngine";
import {
  BarChart3,
  Sparkles,
  ArrowRight,
  MessageCircle,
  Download,
  Maximize2,
  BarChart,
  LineChart,
  PieChart,
  TrendingUp,
  AlertTriangle,
  HelpCircle,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import type { DashboardChart, DashboardMetric, ChartType } from "@/types";
import { LogoBadge } from "@/components/layout/LogoBadge";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
};

const CHART_ICONS: Record<string, typeof BarChart> = {
  bar: BarChart,
  line: LineChart,
  pie: PieChart,
  area: TrendingUp,
  stacked: BarChart3,
};
const SWITCHABLE_TYPES: ChartType[] = ["bar", "line", "pie", "area"];

export function Workspace() {
  const {
    isQuerying,
    metrics,
    components,
    summary,
    narrative,
    error,
    dataSource,
    currentQuery,
    conversationHistory,
    followUpSuggestions,
    clarification,
    cannotAnswer,
    setQuerying,
    addQuery,
    setDashboardData,
    uploadedSchema,
    addConversation,
    setError,
    setClarification,
    setCannotAnswer,
    setExecutedQuery,
    mongoCollection,
  } = useDashboardStore();

  const [chartTypeOverrides, setChartTypeOverrides] = useState<
    Record<string, ChartType>
  >({});
  const [expandedChart, setExpandedChart] = useState<string | null>(null);

  const handleExamplePrompt = useCallback(
    async (prompt: string) => {
      setQuerying(true);
      setError(null);
      setClarification(null);
      setCannotAnswer(null);
      addQuery(prompt);

      try {
        const schema =
          dataSource === "local"
            ? uploadedSchema.length > 0
              ? uploadedSchema
              : await getLocalSchema()
            : [];
        const chatHistory = conversationHistory.slice(-3).flatMap((c) => [
          { role: "user", content: c.query },
          {
            role: "assistant",
            content: c.dashboard
              ? `Generated dashboard: ${c.dashboard.summary || c.query}`
              : "Error",
          },
        ]);

        const res = await fetch("/api/analyze-query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            requestType: "dashboard",
            dataSource,
            conversationHistory: chatHistory,
            localSchema: schema,
            mongoCollection:
              dataSource === "mongodb" ? mongoCollection : undefined,
          }),
        });
        const json = await res.json();

        if (json.rawQueryPlan) {
          setExecutedQuery({
            prompt,
            charts: json.rawQueryPlan.charts || [],
            kpis: json.rawQueryPlan.kpis || [],
            rawJson: json.rawQueryPlan.rawJson || "",
          });
        }

        if (!json.success) {
          setError(json.error || "Failed to analyze query");
          addConversation({
            id: Date.now().toString(),
            query: prompt,
            timestamp: Date.now(),
            dashboard: null,
            error: json.error,
          });
          return;
        }

        if (json.mode === "cannotAnswer") {
          setCannotAnswer(json.reason);
          setDashboardData([], [], "", "", json.followUpSuggestions || []);
          addConversation({
            id: Date.now().toString(),
            query: prompt,
            timestamp: Date.now(),
            dashboard: null,
            error: json.reason,
          });
          return;
        }

        if (json.mode === "clarification") {
          setClarification(json.clarification);
          setDashboardData([], [], "", "", json.followUpSuggestions || []);
          return;
        }

        let metricsData: DashboardMetric[] = [];
        let chartsData: DashboardChart[] = [];
        let summaryText = "";
        let followUps: string[] = [];

        if (json.mode === "local") {
          const plan = json.queryPlan;
          summaryText = plan.summary || "";
          followUps = plan.followUpSuggestions || [];
          chartsData = await Promise.all(
            plan.charts.map(
              async (
                chart: DashboardChart & {
                  metric?: string;
                  dimension?: string;
                  filters?: Record<string, string>;
                },
              ) => {
                const data = await executeLocalQuery({
                  groupBy: chart.dimension,
                  metric: chart.metric,
                  filters: chart.filters,
                  sortOrder: "desc",
                  limit: 20,
                });
                return { ...chart, data };
              },
            ),
          );
          const localRows = await getLocalData();
          metricsData = (plan.kpis || []).map(
            (kpi: { label?: string; value?: string; trend?: string }) => {
              const title = kpi.label || "";
              const expression = kpi.value || "";
              const numeric = evaluateLocalMetricExpression(
                localRows,
                expression,
              );
              return {
                title,
                value: formatLocalMetricValue(title, expression, numeric),
                trend: kpi.trend || "",
                trendPositive: true,
              };
            },
          );
        } else {
          metricsData = json.data?.metrics || [];
          chartsData = json.data?.charts || [];
          summaryText = json.data?.summary || "";
          followUps = json.data?.followUpSuggestions || [];
        }

        setDashboardData(
          metricsData,
          chartsData,
          summaryText,
          summaryText,
          followUps,
        );
        addConversation({
          id: Date.now().toString(),
          query: prompt,
          timestamp: Date.now(),
          dashboard: {
            metrics: metricsData,
            charts: chartsData,
            summary: summaryText,
          },
        });
      } catch {
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setQuerying(false);
      }
    },
    [
      dataSource,
      uploadedSchema,
      setQuerying,
      setError,
      setClarification,
      setCannotAnswer,
      setExecutedQuery,
      addQuery,
      setDashboardData,
      addConversation,
      conversationHistory,
    ],
  );

  const handleChartTypeSwitch = (chartId: string, newType: ChartType) => {
    setChartTypeOverrides((prev) => ({ ...prev, [chartId]: newType }));
  };

  const handleDownloadChart = (chartId: string) => {
    const el = document.getElementById(`chart-${chartId}`);
    if (!el) return;
    const svg = el.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx?.scale(2, 2);
      ctx?.drawImage(img, 0, 0);
      const link = document.createElement("a");
      link.download = `vizlyai-chart-${chartId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Dashboard Header */}
      {(currentQuery || summary) && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2"
        >
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 truncate">
              {currentQuery || "Dashboard"}
            </h2>
            {summary && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="truncate">{summary}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {conversationHistory.length > 0 && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                {conversationHistory.length} queries
              </span>
            )}
            <span className="flex items-center text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
              <span
                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                  dataSource === "server"
                    ? "bg-emerald-500"
                    : dataSource === "mongodb"
                      ? "bg-violet-500"
                      : "bg-blue-500"
                }`}
              />
              {dataSource === "server"
                ? "Sales Data"
                : dataSource === "mongodb"
                  ? `MongoDB: ${mongoCollection}`
                  : "Local CSV"}
            </span>
          </div>
        </motion.div>
      )}

      {/* Executed Query Viewer */}
      <ExecutedQueryViewer />

      <AnimatePresence mode="wait">
        {isQuerying && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <SkeletonDashboard />
          </motion.div>
        )}

        {!isQuerying && error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <ErrorCard
              message={error}
              onRetry={
                currentQuery
                  ? () => handleExamplePrompt(currentQuery)
                  : undefined
              }
            />
          </motion.div>
        )}

        {/* Cannot Answer — Hallucination Prevention */}
        {!isQuerying && cannotAnswer && (
          <motion.div
            key="cannotAnswer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-6 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/50 rounded-2xl"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">
                  Cannot Generate Dashboard
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-400 mt-1">
                  {cannotAnswer}
                </p>
                <div className="mt-3 p-3 bg-orange-100/50 dark:bg-orange-900/20 rounded-lg border border-orange-200/50 dark:border-orange-800/30">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-xs font-medium text-orange-600 dark:text-orange-400">
                      Available Data Columns
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {[
                      "order_id",
                      "date",
                      "product",
                      "category",
                      "region",
                      "sales_rep",
                      "revenue",
                      "cost",
                      "units_sold",
                      "customer_segment",
                    ].map((col) => (
                      <span
                        key={col}
                        className="text-[10px] px-1.5 py-0.5 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded font-mono border border-orange-200/50 dark:border-gray-700"
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
                {followUpSuggestions.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-orange-500 mb-2">
                      Try these instead:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {followUpSuggestions.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => handleExamplePrompt(s)}
                          className="text-xs px-3 py-1.5 bg-white dark:bg-gray-800 border border-orange-200 dark:border-gray-700 rounded-full hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {!isQuerying && clarification && (
          <motion.div
            key="clarification"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl"
          >
            <div className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                  I need a bit more info
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  {clarification}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {!isQuerying &&
          !error &&
          !clarification &&
          !cannotAnswer &&
          components.length > 0 && (
            <motion.div
              key="dashboard"
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-5"
            >
              {/* KPI Cards */}
              {metrics.length > 0 && (
                <motion.div
                  variants={item}
                  className="grid grid-cols-2 gap-3 lg:grid-cols-4"
                >
                  {metrics.map((metric, idx) => (
                    <KPICard key={idx} {...metric} index={idx} />
                  ))}
                </motion.div>
              )}

              {/* Charts */}
              <motion.div
                variants={item}
                className={`grid grid-cols-1 ${components.length > 1 ? "lg:grid-cols-2" : ""} gap-5`}
              >
                {components.map((chart) => {
                  const displayType =
                    chartTypeOverrides[chart.id] || chart.type;
                  const recommendedType =
                    (chart as DashboardChart & { recommendedType?: string })
                      .recommendedType || chart.type;
                  const ChartIcon = CHART_ICONS[displayType] || BarChart;
                  return (
                    <motion.div
                      key={chart.id}
                      variants={item}
                      id={`chart-${chart.id}`}
                      className="group p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col min-h-90 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate">
                            {chart.title}
                          </h3>
                          {chart.subtitle && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">
                              {chart.subtitle}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleDownloadChart(chart.id)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
                            title="Download PNG"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setExpandedChart(chart.id)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
                            title="Expand"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {/* Chart type switcher with recommended dot */}
                      <div className="flex items-center gap-0.5 mb-3">
                        {SWITCHABLE_TYPES.map((t) => {
                          const Icon = CHART_ICONS[t] || BarChart;
                          const isRecommended = t === recommendedType;
                          return (
                            <div key={t} className="relative">
                              <button
                                onClick={() =>
                                  handleChartTypeSwitch(chart.id, t)
                                }
                                className={`p-1.5 rounded ${displayType === t ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600" : "text-gray-300 dark:text-gray-600 hover:text-gray-500"}`}
                                title={`${t}${isRecommended ? " (recommended)" : ""}`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                              </button>
                              {isRecommended && (
                                <span
                                  className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-white dark:border-gray-900"
                                  title="AI Recommended"
                                />
                              )}
                            </div>
                          );
                        })}
                        <span className="ml-2 text-[10px] text-gray-400 uppercase tracking-wider flex items-center gap-1">
                          <ChartIcon className="w-3 h-3" />
                          {displayType}
                        </span>
                      </div>
                      <div className="flex-1 min-h-0">
                        <DynamicChart
                          type={displayType as ChartType}
                          data={chart.data}
                          xAxisKey={chart.xAxisKey}
                          series={chart.series}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>

              {/* Narrative */}
              {(narrative || summary) && (
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
                        {narrative || summary}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Follow-up suggestion chips */}
              {followUpSuggestions.length > 0 && (
                <motion.div variants={item} className="flex flex-wrap gap-2">
                  <span className="text-xs text-gray-400 self-center mr-1">
                    You might also ask:
                  </span>
                  {followUpSuggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleExamplePrompt(suggestion)}
                      className="text-xs px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full hover:border-indigo-400 hover:text-indigo-600 dark:hover:border-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

        {/* Empty state */}
        {!isQuerying &&
          !error &&
          !clarification &&
          !cannotAnswer &&
          components.length === 0 &&
          !followUpSuggestions.length && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <EmptyState onPromptClick={handleExamplePrompt} />
            </motion.div>
          )}
      </AnimatePresence>

      {/* Fullscreen chart modal */}
      {expandedChart && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setExpandedChart(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-4xl max-h-[80vh] overflow-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setExpandedChart(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
            >
              <X className="w-4 h-4" />
            </button>
            {(() => {
              const chart = components.find((c) => c.id === expandedChart);
              if (!chart) return null;
              const displayType = chartTypeOverrides[chart.id] || chart.type;
              return (
                <>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50 mb-4">
                    {chart.title}
                  </h3>
                  <div className="h-125">
                    <DynamicChart
                      type={displayType as ChartType}
                      data={chart.data}
                      xAxisKey={chart.xAxisKey}
                      series={chart.series}
                    />
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({
  onPromptClick,
}: {
  onPromptClick: (prompt: string) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      <div className="mb-5">
        <LogoBadge size="lg" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-1.5">
        Welcome to Viz.ai
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md text-sm mb-6">
        Ask questions in natural language and get instant dashboards with
        charts, KPIs, and AI-powered insights.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg">
        {EXAMPLE_PROMPTS.slice(0, 4).map((prompt) => (
          <button
            key={prompt}
            onClick={() => onPromptClick(prompt)}
            className="group flex items-center gap-3 text-left px-3.5 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-sm transition-all"
          >
            <div className="w-7 h-7 shrink-0 bg-indigo-50 dark:bg-indigo-950/50 rounded-lg flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium truncate flex-1">
              {prompt}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-indigo-500 transition-colors shrink-0" />
          </button>
        ))}
      </div>
      <p className="mt-6 text-xs text-gray-400 dark:text-gray-600 text-center max-w-sm">
        💡 Upload a CSV file to analyze your own data, or use the built-in sales
        dataset. Ask follow-up questions to refine your dashboard.
      </p>
    </div>
  );
}
