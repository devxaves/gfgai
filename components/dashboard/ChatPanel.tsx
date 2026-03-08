"use client";

import { useState, useRef, useEffect } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { X, Send, Loader2, MessageCircle, Sparkles, User } from "lucide-react";

export function ChatPanel() {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    chatPanelOpen, setChatPanelOpen, conversationHistory,
    isQuerying, currentQuery, activeDatasetName, dataSource,
  } = useDashboardStore();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationHistory]);

  useEffect(() => {
    if (chatPanelOpen) inputRef.current?.focus();
  }, [chatPanelOpen]);

  if (!chatPanelOpen) return null;

  const handleSend = async () => {
    if (!input.trim() || isQuerying) return;

    // Dispatch via the QueryInput's handleQuery through store
    const { setQuerying, addQuery, setDashboardData, setError, setClarification,
      addConversation, setExecutedQuery, setCannotAnswer, uploadedSchema } = useDashboardStore.getState();

    const finalQuery = input;
    setInput("");
    setQuerying(true);
    setError(null);
    setClarification(null);
    setCannotAnswer(null);
    addQuery(finalQuery);

    try {
      const chatHistory = conversationHistory.slice(-3).flatMap(c => [
        { role: "user", content: c.query },
        { role: "assistant", content: c.dashboard ? `Generated dashboard: ${c.dashboard.summary || c.query}` : "Error" },
      ]);

      const res = await fetch("/api/analyze-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalQuery,
          dataSource,
          conversationHistory: chatHistory,
          localSchema: dataSource === 'local' ? uploadedSchema : [],
        }),
      });

      const json = await res.json();

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

      if (json.mode === 'cannotAnswer') {
        setCannotAnswer(json.reason);
        setDashboardData([], [], '', '', json.followUpSuggestions || []);
        addConversation({ id: Date.now().toString(), query: finalQuery, timestamp: Date.now(), dashboard: null, error: json.reason });
        return;
      }

      if (json.mode === 'clarification') {
        setClarification(json.clarification);
        setDashboardData([], [], '', '', json.followUpSuggestions || []);
        addConversation({ id: Date.now().toString(), query: finalQuery, timestamp: Date.now(), dashboard: null });
        return;
      }

      const metrics = json.data?.metrics || [];
      const charts = json.data?.charts || [];
      const summary = json.data?.summary || "";
      const followUps = json.data?.followUpSuggestions || [];

      setDashboardData(metrics, charts, summary, summary, followUps);
      addConversation({ id: Date.now().toString(), query: finalQuery, timestamp: Date.now(), dashboard: { metrics, charts, summary, followUpSuggestions: followUps } });
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setQuerying(false);
    }
  };

  return (
    <div className="w-80 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col h-full shrink-0">
      {/* Header */}
      <div className="h-14 border-b border-gray-200 dark:border-gray-800 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">Chat</span>
        </div>
        <button onClick={() => setChatPanelOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Active dataset */}
      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Active Dataset</p>
        <p className="text-xs text-gray-600 dark:text-gray-300 font-medium mt-0.5">{activeDatasetName || 'Sales Dataset 2024'}</p>
        <p className="text-[10px] text-gray-400">{dataSource === 'server' ? 'Built-in' : 'Local CSV'}</p>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-3">
        {conversationHistory.length === 0 ? (
          <div className="text-center py-8">
            <Sparkles className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-400 dark:text-gray-500">Ask questions to filter and explore your dashboard</p>
            <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">e.g. &quot;Now filter to East region&quot;</p>
          </div>
        ) : (
          conversationHistory.map((entry) => (
            <div key={entry.id} className="space-y-2">
              {/* User bubble */}
              <div className="flex items-start gap-2 justify-end">
                <div className="max-w-[85%] bg-indigo-600 text-white px-3 py-2 rounded-xl rounded-br-sm text-sm">
                  {entry.query}
                </div>
                <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center shrink-0">
                  <User className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                </div>
              </div>
              {/* AI bubble */}
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center shrink-0">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                </div>
                <div className="max-w-[85%] bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-xl rounded-bl-sm text-sm text-gray-700 dark:text-gray-300">
                  {entry.error ? (
                    <span className="text-red-500">{entry.error}</span>
                  ) : entry.dashboard?.summary ? (
                    <>
                      <span>{entry.dashboard.summary}</span>
                      {entry.dashboard.charts && entry.dashboard.charts.length > 0 && (
                        <span className="block text-xs text-gray-400 mt-1">📊 {entry.dashboard.charts.length} chart{entry.dashboard.charts.length > 1 ? 's' : ''} generated</span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-400">Dashboard generated</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        {isQuerying && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center shrink-0">
              <Loader2 className="w-3 h-3 text-indigo-600 animate-spin" />
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-xl text-sm text-gray-400">Analyzing...</div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Filter or modify dashboard..."
            className="flex-1 text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 placeholder:text-gray-400"
            disabled={isQuerying}
          />
          <button
            onClick={handleSend}
            disabled={isQuerying || !input.trim()}
            className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-all"
          >
            {isQuerying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
