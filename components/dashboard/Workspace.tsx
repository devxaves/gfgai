"use client";

import { useDashboardStore } from "@/store/useDashboardStore";
import { KPICard } from "@/components/charts/KPICard";
import { DynamicChart } from "@/components/charts/DynamicChart";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Workspace() {
  const { isQuerying, metrics, components, queryHistory, dataSource } = useDashboardStore();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">
          {queryHistory.length > 0 ? queryHistory[0] : "Dashboard"}
        </h2>
        <p className="text-sm text-gray-500 flex items-center">
          <span className={`w-2 h-2 rounded-full mr-2 ${dataSource === 'database' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
          Connected to: {dataSource === 'database' ? 'MongoDB Atlas' : 'Local Dataset'}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {isQuerying && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center p-12 space-y-4"
          >
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            <p className="text-gray-500 font-medium">Analyzing your data...</p>
          </motion.div>
        )}

        {!isQuerying && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* KPI Cards Grid */}
            {metrics.length > 0 && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {metrics.map((metric, idx) => (
                  <KPICard key={idx} {...metric} />
                ))}
              </div>
            )}

            {/* Charts Grid */}
            {components.length > 0 ? (
              <div className={`grid grid-cols-1 ${components.length > 1 ? 'lg:grid-cols-2' : ''} gap-6`}>
                {components.map((chart) => (
                  <div key={chart.id} className="p-6 bg-white rounded-xl shadow-sm border flex flex-col min-h-[400px]">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{chart.title}</h3>
                    <div className="flex-1 min-h-0 relative">
                      <DynamicChart 
                        type={chart.type} 
                        data={chart.data} 
                        xAxisKey={chart.xAxisKey} 
                        series={chart.series} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 text-2xl">
                  👋
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Welcome to InsightAI</h3>
                <p className="text-gray-500 text-center max-w-sm">
                  Start by typing a question in the search bar above, like "Show me sales by region".
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
