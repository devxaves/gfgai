"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { useDashboardStore } from "@/store/useDashboardStore";
import { Lightbulb, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

export default function InsightsPage() {
  const { conversationHistory, metrics, components, summary } = useDashboardStore();
  const lastEntry = conversationHistory.length > 0 ? conversationHistory[conversationHistory.length - 1] : null;

  // Generate insights from the most recent dashboard
  const insights: { text: string; type: "positive" | "negative" | "neutral" }[] = [];

  if (lastEntry?.dashboard) {
    const dash = lastEntry.dashboard;

    if (dash.summary) {
      insights.push({ text: dash.summary, type: "neutral" });
    }

    dash.charts.forEach((chart) => {
      if (chart.data.length > 0) {
        const sorted = [...chart.data].sort((a, b) => (b.value || 0) - (a.value || 0));
        const top = sorted[0];
        const bottom = sorted[sorted.length - 1];

        if (top && bottom && sorted.length > 1) {
          insights.push({
            text: `Top performing: "${top.name}" with a value of ${top.value?.toLocaleString()}`,
            type: "positive",
          });
          insights.push({
            text: `Lowest performing: "${bottom.name}" with a value of ${bottom.value?.toLocaleString()}`,
            type: "negative",
          });

          const total = sorted.reduce((s, r) => s + (r.value || 0), 0);
          const avg = Math.round(total / sorted.length);
          insights.push({
            text: `Average across ${sorted.length} groups: ${avg.toLocaleString()}`,
            type: "neutral",
          });
        }
      }
    });
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="h-[72px] border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl flex items-center px-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-50">Insights</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">AI-generated insights from your data</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            {insights.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/20 rounded-full flex items-center justify-center mb-4">
                  <Lightbulb className="w-8 h-8 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">No insights yet</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Run a query on the Dashboard to generate AI-powered insights.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lastEntry && (
                  <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Insights from: &quot;{lastEntry.query}&quot;</p>
                  </div>
                )}

                {insights.map((insight, idx) => (
                  <div key={idx} className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      insight.type === "positive" ? "bg-emerald-50 dark:bg-emerald-950/30" :
                      insight.type === "negative" ? "bg-red-50 dark:bg-red-950/30" :
                      "bg-gray-50 dark:bg-gray-800"
                    }`}>
                      {insight.type === "positive" ? <TrendingUp className="w-4 h-4 text-emerald-500" /> :
                       insight.type === "negative" ? <TrendingDown className="w-4 h-4 text-red-500" /> :
                       <BarChart3 className="w-4 h-4 text-gray-400" />}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{insight.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
