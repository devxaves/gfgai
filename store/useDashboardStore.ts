import { create } from 'zustand';
import type { DashboardMetric, DashboardChart, ConversationEntry } from '@/types';

export type ChartType = 'line' | 'bar' | 'pie' | 'stacked' | 'area';

interface DashboardState {
  isQuerying: boolean;
  queryHistory: string[];
  currentQuery: string;
  metrics: DashboardMetric[];
  components: DashboardChart[];
  summary: string;
  dataSource: 'database' | 'local';
  uploadedSchema: string[];
  activeDatasetName: string;
  uploadedRowCount: number;
  conversationHistory: ConversationEntry[];
  error: string | null;
  darkMode: boolean;
  sidebarOpen: boolean;

  setQuerying: (status: boolean) => void;
  addQuery: (query: string) => void;
  setCurrentQuery: (query: string) => void;
  setDashboardData: (metrics: DashboardMetric[], components: DashboardChart[], summary?: string) => void;
  setDataSource: (source: 'database' | 'local') => void;
  setUploadedSchema: (schema: string[]) => void;
  setActiveDatasetName: (name: string) => void;
  setUploadedRowCount: (count: number) => void;
  addConversation: (entry: ConversationEntry) => void;
  clearConversationHistory: () => void;
  setError: (error: string | null) => void;
  toggleDarkMode: () => void;
  setSidebarOpen: (open: boolean) => void;
  resetDashboard: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  isQuerying: false,
  queryHistory: [],
  currentQuery: '',
  metrics: [],
  components: [],
  summary: '',
  dataSource: 'database',
  uploadedSchema: [],
  activeDatasetName: '',
  uploadedRowCount: 0,
  conversationHistory: [],
  error: null,
  darkMode: false,
  sidebarOpen: true,

  setQuerying: (status) => set({ isQuerying: status }),

  addQuery: (query) => set((state) => ({
    queryHistory: [query, ...state.queryHistory.slice(0, 49)],
    currentQuery: query,
  })),

  setCurrentQuery: (query) => set({ currentQuery: query }),

  setDashboardData: (metrics, components, summary) => set({
    metrics,
    components,
    summary: summary || '',
    error: null,
  }),

  setDataSource: (source) => set({ dataSource: source }),
  setUploadedSchema: (schema) => set({ uploadedSchema: schema }),
  setActiveDatasetName: (name) => set({ activeDatasetName: name }),
  setUploadedRowCount: (count) => set({ uploadedRowCount: count }),

  addConversation: (entry) => set((state) => ({
    conversationHistory: [...state.conversationHistory, entry],
  })),

  clearConversationHistory: () => set({
    conversationHistory: [],
    queryHistory: [],
    metrics: [],
    components: [],
    summary: '',
    currentQuery: '',
  }),

  setError: (error) => set({ error }),

  toggleDarkMode: () => set((state) => {
    const newMode = !state.darkMode;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('vizlyai-darkmode', String(newMode));
      } catch { /* ignore */ }
    }
    return { darkMode: newMode };
  }),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  resetDashboard: () => set({
    metrics: [],
    components: [],
    summary: '',
    currentQuery: '',
    error: null,
  }),
}));
