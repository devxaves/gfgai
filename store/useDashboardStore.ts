import { create } from 'zustand';
import type { DashboardMetric, DashboardChart, ConversationEntry } from '@/types';

interface ExecutedQueryInfo {
  prompt: string;
  charts: Array<{ title: string; chartType: string; groupBy?: string; aggregation?: string; filters?: unknown }>;
  kpis: Array<{ label: string; expression?: string }>;
  rawJson: string;
}

interface DatasetEntry {
  id: string;
  name: string;
  type: 'preloaded' | 'local' | 'cloud';
  format: 'json' | 'csv' | 'mongodb';
  rowCount: number;
  columns: string[];
  sizeKB?: number;
  uploadedAt?: number;
  tags?: string[];
}

interface DashboardState {
  // Query
  isQuerying: boolean;
  queryHistory: string[];
  currentQuery: string;

  // Dashboard
  metrics: DashboardMetric[];
  components: DashboardChart[];
  summary: string;
  narrative: string;
  followUpSuggestions: string[];
  executedQuery: ExecutedQueryInfo | null;
  cannotAnswer: string | null;

  // Data source
  dataSource: 'server' | 'local';
  uploadedSchema: string[];
  activeDatasetName: string;
  uploadedRowCount: number;
  datasets: DatasetEntry[];
  activeDatasetId: string;

  // Conversation
  conversationHistory: ConversationEntry[];

  // UI
  error: string | null;
  clarification: string | null;
  darkMode: boolean;
  sidebarOpen: boolean;
  chatPanelOpen: boolean;

  // Actions
  setQuerying: (status: boolean) => void;
  addQuery: (query: string) => void;
  setDashboardData: (metrics: DashboardMetric[], components: DashboardChart[], summary?: string, narrative?: string, followUpSuggestions?: string[]) => void;
  setExecutedQuery: (query: ExecutedQueryInfo | null) => void;
  setCannotAnswer: (msg: string | null) => void;
  setDataSource: (source: 'server' | 'local') => void;
  setUploadedSchema: (schema: string[]) => void;
  setActiveDatasetName: (name: string) => void;
  setUploadedRowCount: (count: number) => void;
  addDataset: (dataset: DatasetEntry) => void;
  removeDataset: (id: string) => void;
  setActiveDatasetId: (id: string) => void;
  addConversation: (entry: ConversationEntry) => void;
  clearConversationHistory: () => void;
  setError: (error: string | null) => void;
  setClarification: (msg: string | null) => void;
  toggleDarkMode: () => void;
  setSidebarOpen: (open: boolean) => void;
  setChatPanelOpen: (open: boolean) => void;
  resetDashboard: () => void;
}

const PRELOADED_DATASET: DatasetEntry = {
  id: 'preloaded-sales',
  name: 'Sales Dataset 2024',
  type: 'preloaded',
  format: 'json',
  rowCount: 155,
  columns: ['order_id', 'date', 'product', 'category', 'region', 'sales_rep', 'revenue', 'cost', 'units_sold', 'customer_segment'],
  sizeKB: 28,
  tags: ['Sales', 'Revenue', '2024', 'Built-in'],
};

export const useDashboardStore = create<DashboardState>((set) => ({
  isQuerying: false,
  queryHistory: [],
  currentQuery: '',
  metrics: [],
  components: [],
  summary: '',
  narrative: '',
  followUpSuggestions: [],
  executedQuery: null,
  cannotAnswer: null,
  dataSource: 'server',
  uploadedSchema: [],
  activeDatasetName: 'Sales Dataset 2024',
  uploadedRowCount: 0,
  datasets: [PRELOADED_DATASET],
  activeDatasetId: 'preloaded-sales',
  conversationHistory: [],
  error: null,
  clarification: null,
  darkMode: false,
  sidebarOpen: true,
  chatPanelOpen: false,

  setQuerying: (status) => set({ isQuerying: status }),

  addQuery: (query) => set((state) => ({
    queryHistory: [query, ...state.queryHistory.slice(0, 49)],
    currentQuery: query,
  })),

  setDashboardData: (metrics, components, summary, narrative, followUpSuggestions) => set({
    metrics,
    components,
    summary: summary || '',
    narrative: narrative || '',
    followUpSuggestions: followUpSuggestions || [],
    error: null,
    clarification: null,
    cannotAnswer: null,
  }),

  setExecutedQuery: (query) => set({ executedQuery: query }),
  setCannotAnswer: (msg) => set({ cannotAnswer: msg }),

  setDataSource: (source) => set({ dataSource: source }),
  setUploadedSchema: (schema) => set({ uploadedSchema: schema }),
  setActiveDatasetName: (name) => set({ activeDatasetName: name }),
  setUploadedRowCount: (count) => set({ uploadedRowCount: count }),

  addDataset: (dataset) => set((state) => ({
    datasets: [...state.datasets.filter(d => d.id !== dataset.id), dataset],
  })),
  removeDataset: (id) => set((state) => ({
    datasets: state.datasets.filter(d => d.id !== id && d.type !== 'preloaded'),
  })),
  setActiveDatasetId: (id) => set({ activeDatasetId: id }),

  addConversation: (entry) => set((state) => ({
    conversationHistory: [...state.conversationHistory, entry],
  })),

  clearConversationHistory: () => set({
    conversationHistory: [],
    queryHistory: [],
    metrics: [],
    components: [],
    summary: '',
    narrative: '',
    followUpSuggestions: [],
    currentQuery: '',
    executedQuery: null,
    cannotAnswer: null,
  }),

  setError: (error) => set({ error }),
  setClarification: (msg) => set({ clarification: msg }),

  toggleDarkMode: () => set((state) => {
    const newMode = !state.darkMode;
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('insightai-darkmode', String(newMode)); } catch { /* */ }
    }
    return { darkMode: newMode };
  }),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setChatPanelOpen: (open) => set({ chatPanelOpen: open }),

  resetDashboard: () => set({
    metrics: [],
    components: [],
    summary: '',
    narrative: '',
    followUpSuggestions: [],
    currentQuery: '',
    error: null,
    clarification: null,
    executedQuery: null,
    cannotAnswer: null,
  }),
}));
