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
  /** MongoDB collection name — only set for type === 'cloud' */
  collectionName?: string;
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
  dataSource: 'server' | 'local' | 'mongodb';
  uploadedSchema: string[];
  activeDatasetName: string;
  uploadedRowCount: number;
  datasets: DatasetEntry[];
  activeDatasetId: string;
  /** Active MongoDB collection name when dataSource === 'mongodb' */
  mongoCollection: string;

  // Conversation
  conversationHistory: ConversationEntry[];

  // UI
  error: string | null;
  clarification: string | null;
  darkMode: boolean;
  sidebarOpen: boolean;
  chatPanelOpen: boolean;

  // Compare Mode
  compareMode: boolean;
  compareQuery: string;
  compareMetrics: DashboardMetric[];
  compareComponents: DashboardChart[];
  compareSummary: string;
  compareNarrative: string;
  compareIsQuerying: boolean;

  // Actions
  setQuerying: (status: boolean) => void;
  addQuery: (query: string) => void;
  setDashboardData: (metrics: DashboardMetric[], components: DashboardChart[], summary?: string, narrative?: string, followUpSuggestions?: string[]) => void;
  setExecutedQuery: (query: ExecutedQueryInfo | null) => void;
  setCannotAnswer: (msg: string | null) => void;
  setDataSource: (source: 'server' | 'local' | 'mongodb') => void;
  setUploadedSchema: (schema: string[]) => void;
  setMongoCollection: (name: string) => void;
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

  // Compare actions
  setCompareMode: (on: boolean) => void;
  setCompareQuery: (q: string) => void;
  setCompareDashboardData: (metrics: DashboardMetric[], components: DashboardChart[], summary?: string, narrative?: string) => void;
  setCompareIsQuerying: (status: boolean) => void;
  resetCompare: () => void;
}

const INSURANCE_DATASET: DatasetEntry = {
  id: 'preloaded-insurance',
  name: 'Life Insurance Claims',
  type: 'preloaded',
  format: 'json',
  rowCount: 149,
  columns: ['life_insurer', 'year', 'claims_pending_start_no', 'claims_pending_start_amt', 'claims_intimated_no', 'claims_intimated_amt', 'total_claims_no', 'total_claims_amt', 'claims_paid_no', 'claims_paid_amt', 'claims_repudiated_no', 'claims_repudiated_amt', 'claims_rejected_no', 'claims_rejected_amt', 'claims_unclaimed_no', 'claims_unclaimed_amt', 'claims_pending_end_no', 'claims_pending_end_amt', 'claims_paid_ratio_no', 'claims_paid_ratio_amt', 'claims_repudiated_rejected_ratio_no', 'claims_repudiated_rejected_ratio_amt', 'claims_pending_ratio_no', 'claims_pending_ratio_amt', 'category'],
  sizeKB: 320,
  tags: ['Insurance', 'Claims', 'Life Insurance', 'Built-in'],
};

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

const ECOMMERCE_DATASET: DatasetEntry = {
  id: 'ecommerce_demo',
  name: 'E-Commerce Orders 2024',
  type: 'cloud',
  format: 'mongodb',
  rowCount: 80,
  columns: ['order_id', 'date', 'customer', 'country', 'product', 'category', 'quantity', 'unit_price', 'discount_pct', 'revenue', 'shipping_cost', 'status'],
  sizeKB: 12,
  tags: ['E-Commerce', 'Orders', 'Revenue', 'Demo'],
  collectionName: 'ecommerce_demo',
};

const HR_DATASET: DatasetEntry = {
  id: 'hr_analytics_demo',
  name: 'HR Analytics 2024',
  type: 'cloud',
  format: 'mongodb',
  rowCount: 65,
  columns: ['employee_id', 'name', 'department', 'role', 'hire_date', 'salary', 'performance_score', 'projects_completed', 'region', 'gender', 'age'],
  sizeKB: 9,
  tags: ['HR', 'Employees', 'Performance', 'Demo'],
  collectionName: 'hr_analytics_demo',
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
  activeDatasetName: 'Life Insurance Claims',
  uploadedRowCount: 0,
  datasets: [INSURANCE_DATASET, PRELOADED_DATASET, ECOMMERCE_DATASET, HR_DATASET],
  activeDatasetId: 'preloaded-insurance',
  mongoCollection: '',
  conversationHistory: [],
  error: null,
  clarification: null,
  darkMode: false,
  sidebarOpen: true,
  chatPanelOpen: false,

  // Compare mode
  compareMode: false,
  compareQuery: '',
  compareMetrics: [],
  compareComponents: [],
  compareSummary: '',
  compareNarrative: '',
  compareIsQuerying: false,

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
  setMongoCollection: (collection) => set({ mongoCollection: collection }),
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
      try { localStorage.setItem('vizlyai-darkmode', String(newMode)); } catch { /* */ }
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

  setCompareMode: (on) => set({ compareMode: on }),
  setCompareQuery: (q) => set({ compareQuery: q }),
  setCompareDashboardData: (metrics, components, summary, narrative) => set({
    compareMetrics: metrics,
    compareComponents: components,
    compareSummary: summary || '',
    compareNarrative: narrative || '',
    compareIsQuerying: false,
  }),
  setCompareIsQuerying: (status) => set({ compareIsQuerying: status }),
  resetCompare: () => set({
    compareMode: false,
    compareQuery: '',
    compareMetrics: [],
    compareComponents: [],
    compareSummary: '',
    compareNarrative: '',
    compareIsQuerying: false,
  }),
}));
