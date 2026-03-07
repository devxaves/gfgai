import { create } from 'zustand';

export type ChartType = 'line' | 'bar' | 'pie' | 'stacked';

export interface DashboardMetric {
  title: string;
  value: string | number;
  trend?: string;
  trendPositive?: boolean;
}

export interface DashboardComponent {
  id: string;
  title: string;
  subtitle?: string;
  type: ChartType;
  data: any[];
  xAxisKey: string;
  series: { key: string; color: string; name?: string }[];
}

interface DashboardState {
  isQuerying: boolean;
  queryHistory: string[];
  metrics: DashboardMetric[];
  components: DashboardComponent[];
  dataSource: 'database' | 'local';
  setQuerying: (status: boolean) => void;
  addQuery: (query: string) => void;
  setDashboardData: (metrics: DashboardMetric[], components: DashboardComponent[]) => void;
  setDataSource: (source: 'database' | 'local') => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  isQuerying: false,
  queryHistory: [],
  metrics: [],
  components: [],
  dataSource: 'database',
  setQuerying: (status) => set({ isQuerying: status }),
  addQuery: (query) => set((state) => ({ queryHistory: [query, ...state.queryHistory] })),
  setDashboardData: (metrics, components) => set({ metrics, components }),
  setDataSource: (source) => set({ dataSource: source }),
}));
