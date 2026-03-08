"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { executeLocalQuery, getLocalSchema, getLocalData, evaluateLocalMetricExpression, formatLocalMetricValue } from "@/lib/localQueryEngine";
import { Send, Loader2, Sparkles, Mic, MicOff, ChevronDown, ChevronUp, Code2, Database } from "lucide-react";
import type { DashboardChart, DashboardMetric } from "@/types";

export const EXAMPLE_PROMPTS = [
  "Show me total revenue by region",
  "Compare product categories by sales",
  "Monthly revenue trend over time",
  "Top 5 products by revenue",
  "Revenue breakdown by customer segment",
  "Which sales rep has the highest revenue?",
];

const ROTATING_PLACEHOLDERS = [
  'Try: "Show me monthly revenue trends for 2024"',
  'Try: "Which region has the highest profit margin?"',
  'Try: "Compare sales rep performance by category"',
  'Try: "What is the revenue breakdown by product?"',
  'Try: "Show me top 5 customers by units sold"',
];

export function QueryInput() {
  const [query, setQuery] = useState("");
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const {
    setQuerying, isQuerying, addQuery, setDashboardData,
    dataSource, uploadedSchema, conversationHistory,
    addConversation, setError, setClarification, setExecutedQuery, setCannotAnswer,
    components, mongoCollection,
  } = useDashboardStore();

  // Rotating placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % ROTATING_PLACEHOLDERS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = '44px';
      ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    }
  }, [query]);

  // Voice input
  const toggleVoice = useCallback(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setError('Voice input not supported in this browser');
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const text = event.results[0][0].transcript;
      setQuery(text);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, setError]);

  const handleQuery = useCallback(async (promptText?: string) => {
    const finalQuery = promptText || query;
    if (!finalQuery.trim() || isQuerying) return;

    setQuerying(true);
    setError(null);
    setClarification(null);
    setCannotAnswer(null);
    addQuery(finalQuery);

    try {
      const chatHistory = conversationHistory.slice(-3).flatMap((c) => [
        { role: "user", content: c.query },
        { role: "assistant", content: c.dashboard ? `Generated dashboard: ${c.dashboard.summary || c.query}` : "Error" },
      ]);

      const schema = dataSource === "local"
        ? (uploadedSchema.length > 0 ? uploadedSchema : await getLocalSchema())
        : [];

      const res = await fetch("/api/analyze-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalQuery,
          requestType: "dashboard",
          dataSource,
          conversationHistory: chatHistory,
          localSchema: schema,
          mongoCollection: dataSource === 'mongodb' ? mongoCollection : undefined,
        }),
      });

      const json = await res.json();

      // Store raw query plan
      if (json.rawQueryPlan) {
        setExecutedQuery({
          prompt: finalQuery,
          charts: json.rawQueryPlan.charts || [],
          kpis: json.rawQueryPlan.kpis || [],
          rawJson: json.rawQueryPlan.rawJson || '',
        });
      }

      if (!json.success) {
        setError(json.error || "Failed to analyze query");
        addConversation({ id: Date.now().toString(), query: finalQuery, timestamp: Date.now(), dashboard: null, error: json.error });
        return;
      }

      // Cannot answer — hallucination prevention
      if (json.mode === 'cannotAnswer') {
        setCannotAnswer(json.reason);
        setDashboardData([], [], '', '', json.followUpSuggestions || []);
        addConversation({ id: Date.now().toString(), query: finalQuery, timestamp: Date.now(), dashboard: null, error: json.reason });
        return;
      }

      // Clarification mode
      if (json.mode === 'clarification') {
        setClarification(json.clarification);
        setDashboardData([], [], '', '', json.followUpSuggestions || []);
        addConversation({ id: Date.now().toString(), query: finalQuery, timestamp: Date.now(), dashboard: null });
        return;
      }

      let metrics: DashboardMetric[] = [];
      let charts: DashboardChart[] = [];
      let summary = "";
      let followUps: string[] = [];

      if (json.mode === "local") {
        const plan = json.queryPlan;
        summary = plan.summary || "";
        followUps = plan.followUpSuggestions || [];

        charts = await Promise.all(
          plan.charts.map(async (chart: DashboardChart & { metric?: string; dimension?: string; filters?: Record<string, string> }) => {
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

        const localRows = await getLocalData();
        metrics = (plan.kpis || []).map((kpi: { label?: string; title?: string; value?: string; trend?: string }) => {
          const title = kpi.label || kpi.title || '';
          const expression = kpi.value || '';
          const numeric = evaluateLocalMetricExpression(localRows, expression);
          return {
            title,
            value: formatLocalMetricValue(title, expression, numeric),
            trend: kpi.trend || '',
            trendPositive: true,
          };
        });
      } else {
        metrics = json.data?.metrics || [];
        charts = json.data?.charts || [];
        summary = json.data?.summary || "";
        followUps = json.data?.followUpSuggestions || [];
      }

      setDashboardData(metrics, charts, summary, summary, followUps);
      addConversation({
        id: Date.now().toString(),
        query: finalQuery,
        timestamp: Date.now(),
        dashboard: { metrics, charts, summary, followUpSuggestions: followUps },
      });
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setQuerying(false);
      setQuery("");
    }
  }, [query, isQuerying, dataSource, uploadedSchema, conversationHistory, setQuerying, setError, setClarification, setCannotAnswer, setExecutedQuery, addQuery, setDashboardData, addConversation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleQuery();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleQuery();
    }
  };

  const hasExistingDashboard = components.length > 0;

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center w-full max-w-2xl gap-2">
      <div className="relative flex-1">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none">
          <Sparkles className="w-4 h-4" />
        </div>
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={hasExistingDashboard ? 'Ask a follow-up question...' : ROTATING_PLACEHOLDERS[placeholderIdx]}
          className={`w-full h-11 pl-10 pr-20 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 shadow-sm transition-all bg-white dark:bg-gray-800 dark:text-gray-100 placeholder:text-gray-400 resize-none overflow-hidden leading-6 ${
            isQuerying ? 'opacity-60 cursor-not-allowed' : ''
          }`}
          disabled={isQuerying}
          rows={1}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query.length > 0 && (
            <span className="text-[10px] text-gray-300 dark:text-gray-600 tabular-nums mr-1">{query.length}</span>
          )}
          <button
            type="button"
            onClick={toggleVoice}
            className={`p-1.5 rounded-lg transition-all ${isListening ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'text-gray-400 hover:text-indigo-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            disabled={isQuerying}
            title="Voice input"
          >
            {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          </button>
          <button
            type="submit"
            disabled={isQuerying || !query.trim()}
            className="p-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all disabled:opacity-40 shadow-sm"
          >
            {isQuerying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </form>
  );
}

// Executed Query Viewer — displayed below the prompt area in the Workspace
export function ExecutedQueryViewer() {
  const [expanded, setExpanded] = useState(false);
  const { executedQuery } = useDashboardStore();

  if (!executedQuery) return null;

  return (
    <div className="mt-2 w-full max-w-4xl mx-auto">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors px-2 py-1 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900"
      >
        <Code2 className="w-3 h-3" />
        <span>View Executed Query</span>
        {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {expanded && (
        <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-mono overflow-auto max-h-75">
          <div className="space-y-3">
            <div>
              <span className="text-indigo-500 font-semibold">PROMPT:</span>
              <span className="ml-2 text-gray-700 dark:text-gray-300">&quot;{executedQuery.prompt}&quot;</span>
            </div>
            {executedQuery.charts.map((chart, i) => (
              <div key={i} className="pl-3 border-l-2 border-indigo-200 dark:border-indigo-800">
                <span className="text-violet-500 font-semibold">CHART {i + 1}:</span>
                <span className="ml-2 text-gray-600 dark:text-gray-400">{chart.title}</span>
                <div className="mt-1 text-gray-500 dark:text-gray-500">
                  Type: <span className="text-emerald-600">{chart.chartType}</span>
                  {chart.groupBy && <> | GroupBy: <span className="text-amber-600">{typeof chart.groupBy === 'string' ? chart.groupBy : JSON.stringify(chart.groupBy)}</span></>}
                  {chart.aggregation && <> | Agg: <span className="text-blue-600">{typeof chart.aggregation === 'string' ? chart.aggregation : JSON.stringify(chart.aggregation)}</span></>}
                </div>
              </div>
            ))}
            {executedQuery.kpis.length > 0 && (
              <div>
                <span className="text-amber-500 font-semibold">KPIs:</span>
                {executedQuery.kpis.map((kpi, i) => (
                  <span key={i} className="ml-2 text-gray-600 dark:text-gray-400">{kpi.label}{i < executedQuery.kpis.length - 1 ? ',' : ''}</span>
                ))}
              </div>
            )}
            <details className="mt-2">
              <summary className="text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300">Raw JSON Response</summary>
              <pre className="mt-1 text-[10px] text-gray-500 whitespace-pre-wrap">{executedQuery.rawJson}</pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}
