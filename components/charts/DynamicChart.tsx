"use client";

import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

type ChartProps = {
  type: "bar" | "line" | "pie" | "stacked";
  data: any[];
  xAxisKey: string;
  series: { key: string; color: string; name?: string }[];
};

export function DynamicChart({ type, data, xAxisKey, series }: ChartProps) {
  const isPie = type === "pie";

  if (!data || data.length === 0) {
    return <div className="flex h-full w-full items-center justify-center text-gray-400">No data available</div>;
  }

  const renderTooltip = () => (
    <Tooltip
      contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
      cursor={{ fill: "rgba(0,0,0,0.05)" }}
    />
  );

  if (isPie) {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          {renderTooltip()}
          <Legend />
          <Pie
            data={data}
            dataKey={series[0]?.key || "value"}
            nameKey={xAxisKey}
            cx="50%"
            cy="50%"
            outerRadius={100}
            label
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={series[0]?.color || `hsl(${(index * 45) % 360}, 70%, 50%)`} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      {type === "line" ? (
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis dataKey={xAxisKey} tickLine={false} axisLine={false} tick={{ fill: "#6B7280" }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "#6B7280" }} />
          {renderTooltip()}
          <Legend />
          {series.map((s) => (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.name || s.key} stroke={s.color} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
          ))}
        </LineChart>
      ) : (
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis dataKey={xAxisKey} tickLine={false} axisLine={false} tick={{ fill: "#6B7280" }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "#6B7280" }} />
          {renderTooltip()}
          <Legend />
          {series.map((s) => (
            <Bar 
              key={s.key} 
              dataKey={s.key} 
              name={s.name || s.key} 
              fill={s.color} 
              radius={type === 'stacked' ? [0,0,0,0] : [4, 4, 0, 0]}
              stackId={type === 'stacked' ? "a" : undefined}
            />
          ))}
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}
