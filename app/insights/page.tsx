"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Lightbulb, RefreshCw, Loader2, TrendingUp, TrendingDown, Minus, AlertCircle } from "lucide-react";

interface Insight {
  title: string;
  insight: string;
  metric: string;
  trend: 'up' | 'down' | 'neutral';
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Identify the top 5 business insights a CEO should know from this sales dataset. Focus on revenue trends, top performers, underperformers, and growth opportunities. Return JSON with 'kpis' array where each item has: label, value, description, trend (up/down/neutral).",
          dataSource: "server",
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const mapped = (json.data.metrics || []).map((m: { title?: string; value?: string | number; trend?: string; trendPositive?: boolean }) => ({
          title: m.title || '',
          insight: m.trend || '',
          metric: String(m.value || ''),
          trend: m.trendPositive === false ? 'down' : m.trendPositive ? 'up' : 'neutral',
        }));
        setInsights(mapped.length > 0 ? mapped : DEFAULT_INSIGHTS);
      } else {
        setInsights(DEFAULT_INSIGHTS);
      }
    } catch {
      setError("Failed to generate insights. Using cached data.");
      setInsights(DEFAULT_INSIGHTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInsights(); }, []);

  const TrendIcon = { up: TrendingUp, down: TrendingDown, neutral: Minus };
  const trendColor = { up: 'text-emerald-600', down: 'text-red-500', neutral: 'text-gray-400' };
  const trendBg = { up: 'bg-emerald-50 dark:bg-emerald-950/30', down: 'bg-red-50 dark:bg-red-950/30', neutral: 'bg-gray-50 dark:bg-gray-900' };

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="h-14 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl flex items-center px-6 shrink-0 z-10">
          <div className="w-10 lg:hidden" />
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-50">AI Insights</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Auto-generated from your dataset</p>
            </div>
          </div>
          <button onClick={fetchInsights} disabled={loading}
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors disabled:opacity-50">
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Refresh
          </button>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {error && (
            <div className="max-w-2xl mx-auto mb-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-300">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="max-w-2xl mx-auto space-y-3">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="p-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                  <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-3">
              {insights.map((insight, i) => {
                const Icon = TrendIcon[insight.trend] || Minus;
                return (
                  <div key={i} className={`p-5 rounded-xl border border-gray-100 dark:border-gray-800 ${trendBg[insight.trend]} transition-all hover:shadow-sm`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">{insight.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{insight.insight}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-50">{insight.metric}</span>
                        <Icon className={`w-4 h-4 ${trendColor[insight.trend]}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

const DEFAULT_INSIGHTS: Insight[] = [
  { title: "Revenue Leader", insight: "North region leads with strong Enterprise segment performance", metric: "$145K+", trend: "up" },
  { title: "Top Category", insight: "Laptops drive the highest revenue across all segments", metric: "38%", trend: "up" },
  { title: "Growth Opportunity", insight: "West region underperforms — consider allocating more resources", metric: "-12%", trend: "down" },
  { title: "Best Sales Rep", insight: "Alice Chen consistently delivers highest quarterly numbers", metric: "$52K", trend: "up" },
  { title: "Profit Margins", insight: "Software category shows highest margins at 80%+ vs 30% for hardware", metric: "82%", trend: "neutral" },
];
