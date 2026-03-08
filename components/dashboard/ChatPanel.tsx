"use client";

import { useState, useRef, useEffect } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { X, Send, Loader2, MessageCircle, Sparkles, User, ArrowRight } from "lucide-react";

// ---------------------------------------------------------------------------
// FormattedText — renders plain-text AI responses with visual structure
// Supports: section headings ("Summary:"), bullets ("- "), numbered lists ("1. ")
// ---------------------------------------------------------------------------
function FormattedText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-0.5 text-sm leading-relaxed">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1" />;

        // Section heading — short line ending with ":"
        if (/^[A-Z][^:]{0,40}:\s*$/.test(trimmed)) {
          return (
            <p key={i} className="font-semibold text-gray-800 dark:text-gray-100 mt-2 first:mt-0">
              {trimmed}
            </p>
          );
        }

        // Bullet point
        if (/^[-•*]\s/.test(trimmed)) {
          return (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-indigo-500 mt-0.5 shrink-0 text-xs">●</span>
              <span className="text-gray-700 dark:text-gray-300">{trimmed.slice(2)}</span>
            </div>
          );
        }

        // Numbered list
        if (/^\d+\.\s/.test(trimmed)) {
          const dotIdx = trimmed.indexOf(". ");
          const num = trimmed.slice(0, dotIdx);
          const rest = trimmed.slice(dotIdx + 2);
          return (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-indigo-500 font-semibold shrink-0 min-w-4 text-xs">{num}.</span>
              <span className="text-gray-700 dark:text-gray-300">{rest}</span>
            </div>
          );
        }

        return (
          <p key={i} className="text-gray-700 dark:text-gray-300">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

export function ChatPanel() {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    chatPanelOpen, setChatPanelOpen, conversationHistory,
    isQuerying, currentQuery, activeDatasetName, dataSource, mongoCollection,
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

  const STARTER_SUGGESTIONS = [
    "Summarise the key revenue trends",
    "Which region is underperforming?",
    "Give me 3 actionable recommendations",
    "Who is the top-performing sales rep?",
  ];

  const handleFollowUp = (suggestion: string) => {
    setInput(suggestion);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSend = async () => {
    if (!input.trim() || isQuerying) return;

    const {
      setQuerying, setError, setClarification,
      addConversation, setCannotAnswer, uploadedSchema, mongoCollection,
    } = useDashboardStore.getState();

    const finalQuery = input.trim();
    setInput("");
    setQuerying(true);
    setError(null);
    setClarification(null);
    setCannotAnswer(null);

    try {
      // Build rich history so LLM maintains context
      const { conversationHistory: history } = useDashboardStore.getState();
      const richHistory = history.slice(-5).flatMap((c) => [
        { role: "user" as const, content: c.query },
        {
          role: "assistant" as const,
          content:
            c.chatMessage ||
            (c.dashboard?.summary
              ? `Dashboard summary: ${c.dashboard.summary}`
              : c.error
              ? `Error: ${c.error}`
              : "Generated dashboard"),
        },
      ]);

      const res = await fetch("/api/analyze-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalQuery,
          requestType: "chat",
          dataSource,
          conversationHistory: richHistory,
          localSchema: dataSource === "local" ? uploadedSchema : [],
          mongoCollection: dataSource === 'mongodb' ? mongoCollection : undefined,
        }),
      });

      const json = await res.json();

      if (!json.success) {
        addConversation({
          id: Date.now().toString(),
          query: finalQuery,
          timestamp: Date.now(),
          dashboard: null,
          error: json.error || "Failed to get a response.",
        });
        return;
      }

      // chat mode: { success, mode:'chat', data: { message, followUpSuggestions } }
      const message =
        json.data?.message ||
        json.data?.summary ||
        "I could not generate a response. Please try rephrasing.";
      const followUps: string[] = json.data?.followUpSuggestions || [];

      addConversation({
        id: Date.now().toString(),
        query: finalQuery,
        timestamp: Date.now(),
        dashboard: null,
        chatMessage: message,
        followUpSuggestions: followUps,
      });
    } catch {
      addConversation({
        id: Date.now().toString(),
        query: finalQuery,
        timestamp: Date.now(),
        dashboard: null,
        error: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setQuerying(false);
    }
  };

  return (
    <div className="w-82 border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col h-full shrink-0">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="h-14 border-b border-gray-200 dark:border-gray-800 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">Data Chat</span>
          <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wide">
            AI
          </span>
        </div>
        <button
          onClick={() => setChatPanelOpen(false)}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Active dataset pill ────────────────────────────────────────── */}
      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Active Dataset</p>
        <p className="text-xs text-gray-700 dark:text-gray-300 font-medium mt-0.5 truncate">
          {activeDatasetName || "Sales Dataset 2024"}
        </p>
        <p className="text-[10px] text-gray-400 mt-0.5">
          {dataSource === "server" ? "Built-in preloaded data" : dataSource === "mongodb" ? `MongoDB: ${mongoCollection}` : "Locally uploaded CSV"}
        </p>
      </div>

      {/* ── Messages ────────────────────────────────────────────────────── */}
      <div ref={scrollRef} className="flex-1 overflow-auto p-4 space-y-4">
        {conversationHistory.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Sparkles className="w-5 h-5 text-indigo-500" />
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Chat with your data</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 mb-4">
              Ask questions, get summaries, explore insights
            </p>
            <div className="space-y-1.5 text-left">
              {STARTER_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleFollowUp(s)}
                  className="w-full flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-3 py-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-colors text-left group"
                >
                  <ArrowRight className="w-3 h-3 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  <span>{s}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          conversationHistory.map((entry) => (
            <div key={entry.id} className="space-y-2">
              {/* User bubble */}
              <div className="flex items-start gap-2 justify-end">
                <div className="max-w-[85%] bg-indigo-600 text-white px-3 py-2 rounded-xl rounded-br-sm text-sm leading-relaxed">
                  {entry.query}
                </div>
                <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                </div>
              </div>

              {/* AI bubble */}
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                </div>
                <div className="max-w-[88%] space-y-2">
                  <div className="bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/50 px-3.5 py-3 rounded-xl rounded-bl-sm">
                    {entry.error ? (
                      <p className="text-sm text-red-500">{entry.error}</p>
                    ) : entry.chatMessage ? (
                      <FormattedText text={entry.chatMessage} />
                    ) : entry.dashboard ? (
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {entry.dashboard.summary && (
                          <p className="mb-1">{entry.dashboard.summary}</p>
                        )}
                        {(entry.dashboard.charts?.length ?? 0) > 0 && (
                          <p className="text-xs text-indigo-500 mt-1 flex items-center gap-1">
                            <span>📊</span>
                            {entry.dashboard.charts!.length} chart
                            {entry.dashboard.charts!.length > 1 ? "s" : ""} updated on dashboard
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">No response generated</p>
                    )}
                  </div>

                  {/* Follow-up suggestion chips */}
                  {(entry.followUpSuggestions?.length ?? 0) > 0 && (
                    <div className="flex flex-wrap gap-1.5 pl-0.5">
                      {entry.followUpSuggestions!.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => handleFollowUp(s)}
                          className="text-[11px] px-2.5 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full hover:border-indigo-400 hover:text-indigo-600 dark:hover:border-indigo-600 dark:hover:text-indigo-400 text-gray-500 dark:text-gray-400 transition-colors"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {isQuerying && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center shrink-0">
              <Loader2 className="w-3 h-3 text-indigo-600 animate-spin" />
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 px-3 py-2 rounded-xl text-sm text-gray-400 flex items-center gap-1.5">
              <span>Thinking</span>
              <span className="flex gap-0.5 ml-0.5">
                {[0, 150, 300].map((d) => (
                  <span
                    key={d}
                    className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${d}ms` }}
                  />
                ))}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Input bar ────────────────────────────────────────────────────── */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-1.5">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={isQuerying ? "Generating response…" : "Ask anything about your data…"}
            className="flex-1 text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 placeholder:text-gray-400 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isQuerying}
          />
          <button
            onClick={handleSend}
            disabled={isQuerying || !input.trim()}
            className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-all shrink-0"
          >
            {isQuerying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        {currentQuery && (
          <p className="text-[10px] text-gray-400 truncate px-1">
            <span className="text-gray-300 dark:text-gray-600">Dashboard: </span>
            {currentQuery}
          </p>
        )}
      </div>
    </div>
  );
}
