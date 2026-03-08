"use client";

import { useDashboardStore } from "@/store/useDashboardStore";
import { KPICard } from "@/components/charts/KPICard";
import { DynamicChart } from "@/components/charts/DynamicChart";
import { SkeletonDashboard } from "@/components/dashboard/SkeletonDashboard";
import { ErrorCard } from "@/components/dashboard/ErrorCard";
import { EXAMPLE_PROMPTS } from "@/components/dashboard/QueryInput";
import { executeLocalQuery, getLocalSchema } from "@/lib/localQueryEngine";
import { BarChart3, Sparkles, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { DashboardChart, DashboardMetric } from "@/types";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export function Workspace() {
  const {
    isQuerying, metrics, components, summary, error, dataSource,
    currentQuery, conversationHistory, setQuerying, addQuery,
    setDashboardData, uploadedSchema, addConversation, setError,
  } = useDashboardStore();

  const handleExamplePrompt = async (prompt: string) => {
    setQuerying(true);
    setError(null);
    addQuery(prompt);

    try {
      const schema = dataSource === "local" ? (uploadedSchema.length > 0 ? uploadedSchema : await getLocalSchema()) : [];

      const res = await fetch("/api/analyze-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          dataSource,
          conversationHistory: [],
          localSchema: schema,
        }),
      });

      const json = await res.json();

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

      let metricsData: DashboardMetric[] = [];
      let chartsData: DashboardChart[] = [];
      let summaryText = "";

      if (json.mode === "local") {
        const plan = json.queryPlan;
        summaryText = plan.summary || "";

        chartsData = await Promise.all(
          plan.charts.map(async (chart: any) => {
            const data = await executeLocalQuery({
              groupBy: chart.dimension,
              metric: chart.metric,
              filters: chart.filters,
              sortOrder: "desc",
              limit: 20,
            });
            return { ...chart, data };
          })
        );

        metricsData = await Promise.all(
          plan.kpis.map(async (kpi: any) => {
            const result = await executeLocalQuery({ metric: kpi.expression });
            const value = result[0]?.value ?? 0;
            return {
              title: kpi.title,
              value: typeof value === "number" ? value.toLocaleString() : value,
              trendPositive: true,
              trend: "Local data",
            };
          })
        );
      } else {
        metricsData = json.data?.metrics || [];
        chartsData = json.data?.charts || [];
        summaryText = json.data?.summary || "";
      }

      setDashboardData(metricsData, chartsData, summaryText);
      addConversation({
        id: Date.now().toString(),
        query: prompt,
        timestamp: Date.now(),
        dashboard: { metrics: metricsData, charts: chartsData, summary: summaryText },
      });
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setQuerying(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {(currentQuery || summary) && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
              {currentQuery || "Dashboard"}
            </h2>
            {summary && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                {summary}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {conversationHistory.length > 0 && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {conversationHistory.length} queries in session
              </span>
            )}
            <span className="flex items-center text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
              <span className={`w-2 h-2 rounded-full mr-2 ${dataSource === 'database' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
              {dataSource === 'database' ? 'MongoDB' : 'Local CSV'}
            </span>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {isQuerying && (
          <motion.div key="loading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SkeletonDashboard />
          </motion.div>
        )}

        {!isQuerying && error && (
          <motion.div key="error"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <ErrorCard message={error} />
          </motion.div>
        )}

        {!isQuerying && !error && components.length > 0 && (
          <motion.div key="dashboard"
            variants={container} initial="hidden" animate="show"
            className="space-y-6"
          >
            {metrics.length > 0 && (
              <motion.div variants={item}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
              >
                {metrics.map((metric, idx) => (
                  <KPICard key={idx} {...metric} index={idx} />
                ))}
              </motion.div>
            )}

            <motion.div variants={item}
              className={`grid grid-cols-1 ${components.length > 1 ? 'lg:grid-cols-2' : ''} gap-6`}
            >
              {components.map((chart) => (
                <motion.div
                  key={chart.id}
                  variants={item}
                  className="group p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col min-h-[380px] hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">{chart.title}</h3>
                      {chart.subtitle && (
                        <p className="text-xs text-gray-400 mt-0.5">{chart.subtitle}</p>
                      )}
                    </div>
                    <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md uppercase tracking-wider">
                      {chart.type}
                    </span>
                  </div>
                  <div className="flex-1 min-h-0 relative">
                    <DynamicChart
                      type={chart.type as any}
                      data={chart.data}
                      xAxisKey={chart.xAxisKey}
                      series={chart.series}
                    />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}

        {!isQuerying && !error && components.length === 0 && (
          <motion.div key="empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <EmptyState onPromptClick={handleExamplePrompt} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EmptyState({ onPromptClick }: { onPromptClick: (prompt: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8">
      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-violet-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-blue-500/25">
        <BarChart3 className="w-10 h-10 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-50 mb-2">Welcome to InsightAI</h3>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-lg text-sm leading-relaxed mb-8">
        Ask questions in natural language and get instant dashboards with charts and insights.
        Try one of the examples below or type your own query.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onPromptClick(prompt)}
            className="group flex items-center justify-between gap-3 text-left px-4 py-3.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-md hover:shadow-blue-500/5 transition-all duration-200"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 shrink-0 bg-blue-50 dark:bg-blue-950/50 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-blue-500" />
              </div>
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium truncate">{prompt}</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors shrink-0" />
          </button>
        ))}
      </div>

      <p className="mt-8 text-xs text-gray-400 dark:text-gray-600 text-center max-w-sm">
        💡 You can upload your own CSV from the header, or use the seeded MongoDB data.
        After getting results, ask follow-up questions to refine your dashboard.
      </p>
    </div>
  );
}
