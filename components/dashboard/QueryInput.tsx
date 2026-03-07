"use client";

import { useState } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { Send, Loader2 } from "lucide-react";

export function QueryInput() {
  const [query, setQuery] = useState("");
  const { setQuerying, isQuerying, addQuery, setDashboardData } = useDashboardStore();

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setQuerying(true);
    addQuery(query);

    try {
      const res = await fetch("/api/analyze-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: query }),
      });

      const json = await res.json();
      
      if (json.success) {
        // Constructing dashboard metrics based on AI response 
        // This is simplified based on the PRD for demonstration
        const totalValue = json.data.reduce((acc: number, item: any) => acc + item.value, 0);
        
        const newMetrics = [
          { title: "Total Insight", value: totalValue.toLocaleString(), trendPositive: true, trend: "AI Identified" }
        ];

        const chartColor = "hsl(142.1 76.2% 36.3%)"; // Primary success green or adjust as needed
        const newComponents = [
          {
            id: Date.now().toString(),
            title: `Analysis: ${query}`,
            type: json.queryDetails?.chartType || 'bar',
            data: json.data,
            xAxisKey: "name",
            series: [{ key: "value", color: "#2563EB", name: json.queryDetails?.metric || "Value" }]
          }
        ];

        setDashboardData(newMetrics, newComponents as any);
      } else {
        alert("Error analyzing query: " + json.error);
      }

    } catch (error) {
      console.error(error);
      alert("An unexpected error occurred.");
    } finally {
      setQuerying(false);
      setQuery("");
    }
  };

  return (
    <div className="relative w-full max-w-3xl">
      <form onSubmit={handleQuery} className="relative flex items-center w-full">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask InsightAI (e.g., 'Show me revenue by region')"
          className="w-full h-11 pl-5 pr-12 text-sm border-2 border-gray-200 rounded-full focus:outline-none focus:border-blue-500 shadow-sm transition-colors"
          disabled={isQuerying}
        />
        <button 
          type="submit"
          disabled={isQuerying || !query.trim()}
          className="absolute right-2 top-1.5 p-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:hover:bg-blue-600"
        >
          {isQuerying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
}
