"use client";

import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

type ChartProps = {
  type: "bar" | "line" | "pie" | "stacked" | "area";
  data: any[];
  xAxisKey: string;
  series: { key: string; color: string; name?: string }[];
};

const COLORS = [
  "#2563EB", "#7C3AED", "#DB2777", "#EA580C",
  "#16A34A", "#0891B2", "#4F46E5", "#DC2626",
  "#9333EA", "#0D9488", "#D97706", "#6366F1",
];

const tooltipStyle = {
  contentStyle: {
    borderRadius: "12px",
    border: "none",
    boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.1)",
    fontSize: "13px",
    padding: "10px 14px",
  },
  cursor: { fill: "rgba(0,0,0,0.04)" },
};

export function DynamicChart({ type, data, xAxisKey, series }: ChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
        No data available
      </div>
    );
  }

  if (type === "pie") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip {...tooltipStyle} />
          <Legend
            wrapperStyle={{ fontSize: "12px" }}
            formatter={(value) => <span className="text-gray-600 dark:text-gray-300">{value}</span>}
          />
          <Pie
            data={data}
            dataKey={series[0]?.key || "value"}
            nameKey={xAxisKey}
            cx="50%"
            cy="45%"
            innerRadius={50}
            outerRadius={100}
            paddingAngle={3}
            label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
            labelLine={{ strokeWidth: 1.5 }}
            strokeWidth={2}
            stroke="var(--color-background, #fff)"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (type === "area") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            {series.map((s, i) => (
              <linearGradient key={s.key} id={`gradient-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color || COLORS[i]} stopOpacity={0.3} />
                <stop offset="100%" stopColor={s.color || COLORS[i]} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis dataKey={xAxisKey} tickLine={false} axisLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} />
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          {series.map((s, i) => (
            <Area
              key={s.key} type="monotone" dataKey={s.key} name={s.name || s.key}
              stroke={s.color || COLORS[i]} strokeWidth={2.5}
              fill={`url(#gradient-${s.key})`}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (type === "line") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis dataKey={xAxisKey} tickLine={false} axisLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} />
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          {series.map((s, i) => (
            <Line
              key={s.key} type="monotone" dataKey={s.key} name={s.name || s.key}
              stroke={s.color || COLORS[i]} strokeWidth={2.5}
              dot={{ r: 4, fill: s.color || COLORS[i], strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 6, fill: s.color || COLORS[i], strokeWidth: 2, stroke: "#fff" }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // Bar / Stacked
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
        <XAxis dataKey={xAxisKey} tickLine={false} axisLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} />
        <Tooltip {...tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
        {series.map((s, i) => (
          <Bar
            key={s.key} dataKey={s.key} name={s.name || s.key}
            fill={s.color || COLORS[i]}
            radius={type === "stacked" ? [0, 0, 0, 0] : [6, 6, 0, 0]}
            stackId={type === "stacked" ? "a" : undefined}
            maxBarSize={60}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
