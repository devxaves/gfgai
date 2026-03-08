"use client";

import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Brush,
} from "recharts";

type ChartProps = {
  type: "bar" | "line" | "pie" | "stacked" | "area";
  data: any[];
  xAxisKey: string;
  series: { key: string; color: string; name?: string }[];
};

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b",
  "#10b981", "#0891b2", "#4f46e5", "#ef4444",
  "#9333ea", "#0d9488", "#d97706", "#3b82f6",
];

const formatValue = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return typeof value === 'number' ? value.toLocaleString() : value;
};

const tooltipStyle = {
  contentStyle: {
    borderRadius: "12px",
    border: "1px solid rgba(0,0,0,0.05)",
    boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.05)",
    fontSize: "13px",
    padding: "10px 14px",
    backgroundColor: "rgba(255,255,255,0.98)",
  },
  cursor: { fill: "rgba(99, 102, 241, 0.06)" },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipStyle.contentStyle}>
      <p style={{ fontWeight: 600, marginBottom: 4, fontSize: 12, color: '#374151' }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: p.color }} />
          <span style={{ fontSize: 12, color: '#6b7280' }}>{p.name || p.dataKey}:</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{formatValue(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export function DynamicChart({ type, data, xAxisKey, series }: ChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center text-gray-400 dark:text-gray-500 text-sm">
        No data available
      </div>
    );
  }

  const showBrush = data.length > 8;

  if (type === "pie") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip content={<CustomTooltip />} />
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
            animationBegin={0}
            animationDuration={800}
            animationEasing="ease-out"
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
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: showBrush ? 30 : 0 }}>
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
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} tickFormatter={formatValue} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          {series.map((s, i) => (
            <Area
              key={s.key} type="monotone" dataKey={s.key} name={s.name || s.key}
              stroke={s.color || COLORS[i]} strokeWidth={2.5}
              fill={`url(#gradient-${s.key})`}
              animationDuration={800}
            />
          ))}
          {showBrush && <Brush dataKey={xAxisKey} height={20} stroke="#6366f1" fill="rgba(99,102,241,0.05)" travellerWidth={8} />}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (type === "line") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: showBrush ? 30 : 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis dataKey={xAxisKey} tickLine={false} axisLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} tickFormatter={formatValue} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          {series.map((s, i) => (
            <Line
              key={s.key} type="monotone" dataKey={s.key} name={s.name || s.key}
              stroke={s.color || COLORS[i]} strokeWidth={2.5}
              dot={{ r: 4, fill: s.color || COLORS[i], strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 6, fill: s.color || COLORS[i], strokeWidth: 2, stroke: "#fff" }}
              animationDuration={800}
            />
          ))}
          {showBrush && <Brush dataKey={xAxisKey} height={20} stroke="#6366f1" fill="rgba(99,102,241,0.05)" travellerWidth={8} />}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // Bar / Stacked
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: showBrush ? 30 : 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
        <XAxis dataKey={xAxisKey} tickLine={false} axisLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} tickFormatter={formatValue} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: "12px" }} />
        {series.map((s, i) => (
          <Bar
            key={s.key} dataKey={s.key} name={s.name || s.key}
            fill={s.color || COLORS[i]}
            radius={type === "stacked" ? [0, 0, 0, 0] : [6, 6, 0, 0]}
            stackId={type === "stacked" ? "a" : undefined}
            maxBarSize={60}
            animationDuration={800}
          />
        ))}
        {showBrush && <Brush dataKey={xAxisKey} height={20} stroke="#6366f1" fill="rgba(99,102,241,0.05)" travellerWidth={8} />}
      </BarChart>
    </ResponsiveContainer>
  );
}
