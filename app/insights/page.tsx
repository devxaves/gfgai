"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { useDashboardStore } from "@/store/useDashboardStore";
import { Lightbulb, RefreshCw, Loader2, TrendingUp, TrendingDown, Minus, AlertCircle, Send, Sparkles, User, Database, BarChart3, Rows3, Columns3, Tag, Mic, MicOff, Volume2, VolumeX } from "lucide-react";

interface Insight {
  title: string;
  insight: string;
  metric: string;
  trend: 'up' | 'down' | 'neutral';
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  dataHighlights?: string[];
  conversationHighlights?: string[];
  followUpSuggestions?: string[];
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [highlightTabByMessage, setHighlightTabByMessage] = useState<Record<string, 'data' | 'conversation'>>({});
  const chatRef = useRef<HTMLDivElement>(null);

  // Voice state
  const [voiceMode, setVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const handleChatSendRef = useRef<(text?: string) => Promise<void>>(async () => {});

  const { dataSource, activeDatasetName, uploadedRowCount, uploadedSchema, datasets, activeDatasetId, mongoCollection } = useDashboardStore();

  const activeDs = datasets.find(d => d.id === activeDatasetId);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Identify the top 5 key business insights from ${activeDs?.name || activeDatasetName || 'this dataset'}. Focus on top performers, underperformers, trends, and growth opportunities.`,
          requestType: "dashboard",
          dataSource,
          activeDatasetId,
          mongoCollection: dataSource === 'mongodb' ? mongoCollection : undefined,
          localSchema: dataSource === 'local' ? uploadedSchema : [],
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
        const serverFallback = activeDatasetId === 'preloaded-insurance' ? DEFAULT_INSURANCE_INSIGHTS : DEFAULT_INSIGHTS;
        setInsights(mapped.length > 0 ? mapped : (dataSource === 'server' ? serverFallback : []));
      } else {
        setInsights(dataSource === 'server' ? (activeDatasetId === 'preloaded-insurance' ? DEFAULT_INSURANCE_INSIGHTS : DEFAULT_INSIGHTS) : []);
      }
    } catch {
      setError("Failed to generate insights. Please try refreshing.");
      setInsights(dataSource === 'server' ? (activeDatasetId === 'preloaded-insurance' ? DEFAULT_INSURANCE_INSIGHTS : DEFAULT_INSIGHTS) : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setInsights([]);
    setChatMessages([]);
    fetchInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDatasetId, dataSource, mongoCollection]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [chatMessages]);

  const handleChatSend = async (voiceText?: string) => {
    const finalInput = voiceText || chatInput;
    if (!finalInput.trim() || chatLoading) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: finalInput, timestamp: Date.now() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const chatHistory = chatMessages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/analyze-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: finalInput,
          requestType: "insights-chat",
          dataSource,
          activeDatasetId,
          mongoCollection: dataSource === 'mongodb' ? mongoCollection : undefined,
          conversationHistory: chatHistory,
          localSchema: dataSource === 'local' ? uploadedSchema : [],
        }),
      });
      const json = await res.json();

      let response = "I couldn't generate a response. Please try again.";
      let dataHighlights: string[] = [];
      let conversationHighlights: string[] = [];
      let followUpSuggestions: string[] = [];
      if (json.success) {
        if (json.mode === 'insights-chat') {
          response = json.data?.message || response;
          dataHighlights = json.data?.dataHighlights || [];
          conversationHighlights = json.data?.conversationHighlights || [];
          followUpSuggestions = json.data?.followUpSuggestions || [];
        } else if (json.data?.summary) response = json.data.summary;
        else if (json.mode === 'cannotAnswer') response = json.reason || "This query cannot be answered with the current dataset.";
        else if (json.mode === 'clarification') response = json.clarification || "Could you be more specific?";
      } else {
        response = json.error || "Something went wrong.";
      }

      const assistantId = `a-${Date.now()}`;
      setChatMessages(prev => [...prev, {
        id: assistantId,
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
        dataHighlights,
        conversationHighlights,
        followUpSuggestions,
      }]);

      if (dataHighlights.length > 0 || conversationHighlights.length > 0) {
        setHighlightTabByMessage(prev => ({ ...prev, [assistantId]: dataHighlights.length > 0 ? 'data' : 'conversation' }));
      }
      // Speak the response when voice mode is active
      if (voiceMode && response) speak(response);
    } catch {
      setChatMessages(prev => [...prev, {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: "An error occurred. Please try again.",
        timestamp: Date.now(),
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const TrendIcon = { up: TrendingUp, down: TrendingDown, neutral: Minus };
  const trendColor = { up: 'text-emerald-600', down: 'text-red-500', neutral: 'text-gray-400' };
  const trendBg = { up: 'bg-emerald-50 dark:bg-emerald-950/30', down: 'bg-red-50 dark:bg-red-950/30', neutral: 'bg-gray-50 dark:bg-gray-900' };

  // Keep ref in sync so voice callback always calls the latest version
  useEffect(() => { handleChatSendRef.current = handleChatSend; });

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1;
    utter.onstart = () => setIsSpeaking(true);
    utter.onend   = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utter);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const toggleVoice = useCallback(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;
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
      setChatInput(text);
      setIsListening(false);
      if (voiceMode) handleChatSendRef.current(text);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend   = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening, voiceMode]);

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="h-14 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl flex items-center px-6 shrink-0 z-10">
          <div className="w-10 lg:hidden" />
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 bg-linear-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-50">AI Insights</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Real-time analysis of your dataset</p>
            </div>
          </div>
          <button onClick={fetchInsights} disabled={loading}
            className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1.5 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors disabled:opacity-50">
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Refresh
          </button>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="flex flex-col lg:flex-row h-full">
            {/* Left: Insights */}
            <div className="flex-1 overflow-auto p-6 space-y-5">

              {/* Active Dataset Summary */}
              <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                    <Database className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50 truncate">{activeDs?.name || activeDatasetName || 'Sales Dataset 2024'}</h3>
                    <p className="text-[10px] text-gray-400">{dataSource === 'server' ? 'Built-in Preloaded Dataset' : dataSource === 'mongodb' ? 'MongoDB Cloud Dataset' : 'Locally Uploaded CSV'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="flex items-center gap-1.5 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Rows3 className="w-3.5 h-3.5 text-blue-500" />
                    <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{(activeDs?.rowCount || uploadedRowCount || 155).toLocaleString()} rows</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Columns3 className="w-3.5 h-3.5 text-violet-500" />
                    <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{(activeDs?.columns.length || uploadedSchema.length || 10)} cols</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-xs font-bold text-gray-900 dark:text-gray-100">{activeDs?.format?.toUpperCase() || 'JSON'}</span>
                  </div>
                </div>
                {activeDs?.tags && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <Tag className="w-3 h-3 text-gray-400" />
                    <div className="flex flex-wrap gap-1">
                      {activeDs.tags.map(tag => (
                        <span key={tag} className="text-[10px] bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md font-medium">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
                {/* Column chips */}
                {(activeDs?.columns || uploadedSchema).length > 0 && (
                  <div>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1.5">Columns</p>
                    <div className="flex flex-wrap gap-1">
                      {(activeDs?.columns || uploadedSchema).map(col => (
                        <button
                          key={col}
                          onClick={() => setChatInput(`Tell me about the "${col}" column`)}
                          className="text-[10px] px-1.5 py-0.5 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded font-mono border border-gray-200 dark:border-gray-700 hover:border-indigo-400 hover:text-indigo-600 transition-colors cursor-pointer"
                        >
                          {col}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <p className="text-xs text-amber-700 dark:text-amber-300">{error}</p>
                </div>
              )}

              {loading ? (
                <div className="space-y-3">
                  {[0, 1, 2, 3, 4].map(i => (
                    <div key={i} className="p-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
                      <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                      <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded" />
                    </div>
                  ))}
                </div>
              ) : insights.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Lightbulb className="w-8 h-8 text-gray-300 dark:text-gray-700 mb-3" />
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No insights yet</p>
                  <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">Click <strong>Refresh</strong> to generate insights for this dataset</p>
                </div>
              ) : (
                <div className="space-y-3">
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
            </div>

            {/* Right: Chat Panel */}
            <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 flex flex-col">
              <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">Ask about this dataset</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">Get AI-powered answers about your data</p>
              </div>

              <div ref={chatRef} className="flex-1 overflow-auto p-4 space-y-3 min-h-50">
                {chatMessages.length === 0 && (
                  <div className="text-center py-6">
                    <Sparkles className="w-6 h-6 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">Ask questions like:</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">&quot;What is the best performing region?&quot;</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 italic">&quot;Summarize the revenue trends&quot;</p>
                  </div>
                )}

                {chatMessages.map(msg => (
                  <div key={msg.id} className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center shrink-0">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                      </div>
                    )}
                    <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-bl-sm'
                    }`}>
                      <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                      {msg.role === 'assistant' && ((msg.dataHighlights?.length || 0) > 0 || (msg.conversationHighlights?.length || 0) > 0) && (
                        <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-2">
                          <div className="mb-2 flex items-center gap-1">
                            <button
                              onClick={() => setHighlightTabByMessage(prev => ({ ...prev, [msg.id]: 'data' }))}
                              className={`px-2 py-1 text-[10px] rounded-md font-medium transition-colors ${
                                (highlightTabByMessage[msg.id] || 'data') === 'data'
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                              }`}
                            >
                              Data Highlights
                            </button>
                            <button
                              onClick={() => setHighlightTabByMessage(prev => ({ ...prev, [msg.id]: 'conversation' }))}
                              className={`px-2 py-1 text-[10px] rounded-md font-medium transition-colors ${
                                (highlightTabByMessage[msg.id] || 'data') === 'conversation'
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                              }`}
                            >
                              Conversation Highlights
                            </button>
                          </div>

                          <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300 list-disc pl-4">
                            {((highlightTabByMessage[msg.id] || 'data') === 'data'
                              ? msg.dataHighlights
                              : msg.conversationHighlights
                            )?.map((item, idx) => (
                              <li key={`${msg.id}-${idx}`}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Follow-up suggestion chips */}
                      {msg.role === 'assistant' && (msg.followUpSuggestions?.length ?? 0) > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-[10px] text-gray-400 mb-1.5 font-medium">Ask next:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.followUpSuggestions!.map((s, idx) => (
                              <button
                                key={idx}
                                onClick={() => setChatInput(s)}
                                className="text-[11px] px-2.5 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full hover:border-amber-400 hover:text-amber-600 dark:hover:border-amber-500 dark:hover:text-amber-400 text-gray-500 dark:text-gray-400 transition-colors"
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center shrink-0">
                        <User className="w-3 h-3 text-gray-500" />
                      </div>
                    )}
                  </div>
                ))}

                {chatLoading && (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                      <Loader2 className="w-3 h-3 text-amber-600 animate-spin" />
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-xl text-sm text-gray-400">Thinking...</div>
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-gray-200 dark:border-gray-800">
                {/* Voice mode status banner */}
                {voiceMode && (
                  <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-[11px] font-medium mb-2 ${
                    isListening ? 'bg-red-50 dark:bg-red-950/30 text-red-600' :
                    isSpeaking  ? 'bg-violet-50 dark:bg-violet-950/30 text-violet-600' :
                                  'bg-amber-50 dark:bg-amber-950/30 text-amber-600'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      isListening ? 'bg-red-500 animate-pulse' :
                      isSpeaking  ? 'bg-violet-500 animate-pulse' : 'bg-amber-500'
                    }`} />
                    {isListening ? 'Listening…' : isSpeaking ? (
                      <>
                        Speaking…
                        <button type="button" onClick={stopSpeaking} className="ml-1 underline">stop</button>
                      </>
                    ) : 'Voice mode on — click mic to speak'}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {/* Voice mode toggle */}
                  <button
                    type="button"
                    onClick={() => { setVoiceMode(v => !v); stopSpeaking(); }}
                    className={`p-2 rounded-lg transition-all shrink-0 ${
                      voiceMode ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'text-gray-400 hover:text-amber-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    title={voiceMode ? 'Disable voice mode' : 'Enable voice mode'}
                  >
                    {voiceMode ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                  <input
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleChatSend(); } }}
                    placeholder={voiceMode ? 'Click mic or type…' : 'Ask about the data...'}
                    className="flex-1 text-sm px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30 placeholder:text-gray-400"
                    disabled={chatLoading}
                  />
                  {/* Mic button */}
                  <button
                    type="button"
                    onClick={toggleVoice}
                    disabled={chatLoading}
                    className={`p-2 rounded-lg transition-all shrink-0 ${
                      isListening ? 'bg-red-100 dark:bg-red-950/30 text-red-600' : 'text-gray-400 hover:text-amber-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    title="Voice input"
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleChatSend()} disabled={chatLoading || !chatInput.trim()}
                    className="p-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40 transition-all shrink-0">
                    {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
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

const DEFAULT_INSURANCE_INSIGHTS: Insight[] = [
  { title: "Top Insurer", insight: "LIC dominates with the highest total claims paid across all years", metric: "#1", trend: "up" },
  { title: "Settlement Ratio", insight: "Industry average claims settlement ratio is above 97% by count", metric: "97%+", trend: "up" },
  { title: "Claims Growth", insight: "Total claims intimated increased year-over-year from 2018-19 to 2021-22", metric: "↑ YoY", trend: "up" },
  { title: "Repudiation Risk", insight: "Some private insurers show higher repudiation ratios — review underwriting", metric: "~2%", trend: "down" },
  { title: "Pending Claims", insight: "Pending claims ratio at year-end is a key efficiency indicator to watch", metric: "<1%", trend: "neutral" },
];
