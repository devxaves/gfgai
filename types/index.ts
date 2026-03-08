// ============================================================================
// InsightAI — Shared TypeScript Types
// ============================================================================

export type ChartType = 'line' | 'bar' | 'pie' | 'stacked' | 'area';

export interface ChartSeries {
  key: string;
  color: string;
  name?: string;
}

export interface DashboardMetric {
  title: string;
  value: string | number;
  trend?: string;
  trendPositive?: boolean;
  icon?: string;
}

export interface DashboardChart {
  id: string;
  title: string;
  subtitle?: string;
  type: ChartType;
  data: Record<string, unknown>[];
  xAxisKey: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  series: ChartSeries[];
}

export interface DashboardLayout {
  metrics: DashboardMetric[];
  charts: DashboardChart[];
  summary?: string;
  followUpSuggestions?: string[];
}

export interface ConversationEntry {
  id: string;
  query: string;
  timestamp: number;
  dashboard: DashboardLayout | null;
  error?: string;
  /** Plain-text AI response for chat-mode entries */
  chatMessage?: string;
  /** Follow-up suggestions returned alongside a chat response */
  followUpSuggestions?: string[];
}
