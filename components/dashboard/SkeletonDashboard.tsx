"use client";

export function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* AI thinking text */}
      <div className="flex items-center gap-3 text-sm text-blue-600 dark:text-blue-400 font-medium">
        <div className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
        </div>
        Analyzing your data&hellip;
      </div>

      {/* KPI skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-3"></div>
            <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-3 w-16 bg-gray-100 dark:bg-gray-800 rounded"></div>
          </div>
        ))}
      </div>

      {/* Chart skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="p-6 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 min-h-[380px]">
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
            <div className="flex items-end justify-between gap-2 h-64 px-4">
              {[40, 70, 55, 85, 65, 90, 75, 50].map((h, j) => (
                <div
                  key={j}
                  className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-t-md"
                  style={{ height: `${h}%` }}
                ></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
