import { create } from 'zustand';
import type { DashboardMetric, DashboardChart, ConversationEntry } from '@/types';

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

  // Data source
  dataSource: 'server' | 'local';
  uploadedSchema: string[];
  activeDatasetName: string;
  uploadedRowCount: number;

  // Conversation
  conversationHistory: ConversationEntry[];

  // UI
  error: string | null;
  clarification: string | null;
  darkMode: boolean;
  sidebarOpen: boolean;

  // Actions
  setQuerying: (status: boolean) => void;
  addQuery: (query: string) => void;
  setDashboardData: (metrics: DashboardMetric[], components: DashboardChart[], summary?: string, narrative?: string, followUpSuggestions?: string[]) => void;
  setDataSource: (source: 'server' | 'local') => void;
  setUploadedSchema: (schema: string[]) => void;
  setActiveDatasetName: (name: string) => void;
  setUploadedRowCount: (count: number) => void;
  addConversation: (entry: ConversationEntry) => void;
  clearConversationHistory: () => void;
  setError: (error: string | null) => void;
  setClarification: (msg: string | null) => void;
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
  narrative: '',
  followUpSuggestions: [],
  dataSource: 'server',
  uploadedSchema: [],
  activeDatasetName: '',
  uploadedRowCount: 0,
  conversationHistory: [],
  error: null,
  clarification: null,
  darkMode: false,
  sidebarOpen: true,

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
    narrative: '',
    followUpSuggestions: [],
    currentQuery: '',
  }),

  setError: (error) => set({ error }),
  setClarification: (msg) => set({ clarification: msg }),

  toggleDarkMode: () => set((state) => {
    const newMode = !state.darkMode;
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('insightai-darkmode', String(newMode)); } catch { /* ignore */ }
    }
    return { darkMode: newMode };
  }),

  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  resetDashboard: () => set({
    metrics: [],
    components: [],
    summary: '',
    narrative: '',
    followUpSuggestions: [],
    currentQuery: '',
    error: null,
    clarification: null,
  }),
}));
