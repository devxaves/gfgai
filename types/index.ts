// ============================================================================
// Vizly AI — Shared TypeScript Types
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
  data: Record<string, any>[];
  xAxisKey: string;
  series: ChartSeries[];
}

export interface DashboardLayout {
  metrics: DashboardMetric[];
  charts: DashboardChart[];
  summary?: string;
}

export interface ConversationEntry {
  id: string;
  query: string;
  timestamp: number;
  dashboard: DashboardLayout | null;
  error?: string;
}

export interface QueryRequest {
  prompt: string;
  dataSource: 'database' | 'local';
  conversationHistory?: { role: string; content: string }[];
  localData?: Record<string, any>[];
  localSchema?: string[];
}

export interface QueryResponse {
  success: boolean;
  data?: DashboardLayout;
  error?: string;
}

export interface GeminiQueryResult {
  metrics: {
    metric: string;
    dimension: string;
    filters?: Record<string, any>;
  }[];
  charts: {
    title: string;
    chartType: ChartType;
    metric: string;
    dimension: string;
    filters?: Record<string, any>;
  }[];
  kpis: {
    title: string;
    expression: string;
  }[];
  summary: string;
}

export interface DatasetInfo {
  name: string;
  rowCount: number;
  columns: string[];
  uploadedAt: number;
}
