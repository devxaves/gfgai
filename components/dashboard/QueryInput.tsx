"use client";

import { useState, useRef } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { executeLocalQuery, getLocalSchema } from "@/lib/localQueryEngine";
import { Send, Loader2, Sparkles } from "lucide-react";
import type { DashboardChart, DashboardMetric } from "@/types";

export const EXAMPLE_PROMPTS = [
  "Show me total revenue by region",
  "Compare product categories by sales",
  "Monthly revenue trend over time",
  "Top 5 products by revenue",
];

export function QueryInput() {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    setQuerying, isQuerying, addQuery, setDashboardData,
    dataSource, uploadedSchema, conversationHistory,
    addConversation, setError, components,
  } = useDashboardStore();

  const handleQuery = async (promptText?: string) => {
    const finalQuery = promptText || query;
    if (!finalQuery.trim()) return;

    setQuerying(true);
    setError(null);
    addQuery(finalQuery);

    try {
      const chatHistory = conversationHistory.slice(-4).flatMap((c) => [
        { role: "user", content: c.query },
        { role: "assistant", content: c.dashboard ? `Generated dashboard: ${c.dashboard.summary || c.query}` : "Error" },
      ]);

      const schema = dataSource === "local" ? (uploadedSchema.length > 0 ? uploadedSchema : await getLocalSchema()) : [];

      const res = await fetch("/api/analyze-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalQuery,
          dataSource,
          conversationHistory: chatHistory,
          localSchema: schema,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        setError(json.error || "Failed to analyze query");
        addConversation({
          id: Date.now().toString(),
          query: finalQuery,
          timestamp: Date.now(),
          dashboard: null,
          error: json.error,
        });
        return;
      }

      let metrics: DashboardMetric[] = [];
      let charts: DashboardChart[] = [];
      let summary = "";

      if (json.mode === "local") {
        const plan = json.queryPlan;
        summary = plan.summary || "";

        charts = await Promise.all(
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

        metrics = await Promise.all(
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
        metrics = json.data?.metrics || [];
        charts = json.data?.charts || [];
        summary = json.data?.summary || "";
      }

      setDashboardData(metrics, charts, summary);

      addConversation({
        id: Date.now().toString(),
        query: finalQuery,
        timestamp: Date.now(),
        dashboard: { metrics, charts, summary },
      });
    } catch (error: any) {
      console.error(error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setQuerying(false);
      setQuery("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleQuery();
  };

  const hasExistingDashboard = components.length > 0;

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center w-full max-w-2xl">
      <div className="absolute left-4 text-blue-500 pointer-events-none">
        <Sparkles className="w-4 h-4" />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={
          hasExistingDashboard
            ? 'Refine your dashboard (e.g., "Filter to East region")'
            : 'Ask Vizly AI anything about your data...'
        }
        className="w-full h-11 pl-10 pr-12 text-sm border border-gray-200 dark:border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 shadow-sm transition-all bg-white dark:bg-gray-800 dark:text-gray-100 placeholder:text-gray-400"
        disabled={isQuerying}
      />
      <button
        type="submit"
        disabled={isQuerying || !query.trim()}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-40 disabled:hover:bg-blue-600 shadow-sm hover:shadow-md"
      >
        {isQuerying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
      </button>
    </form>
  );
}
