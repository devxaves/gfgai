import { create } from 'zustand';

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'demo';
  chats?: Array<{
    id: string;
    title: string;
    timestamp: number;
    summary?: string;
  }>;
  createdAt?: string;
}

interface AuthState {
  user: UserData | null;
  isAuthenticated: boolean;
  isDemoUser: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  loginSuccess: (user: UserData) => void;
  loginError: (error: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  clearError: () => void;
  setDemoUser: () => void;
  addChat: (chat: { id: string; title: string; timestamp: number; summary?: string }) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isDemoUser: false,
  isLoading: false,
  error: null,

  loginSuccess: (user) => {
    set({
      user,
      isAuthenticated: true,
      isDemoUser: false,
      error: null,
    });
  },

  loginError: (error) => {
    set({
      error,
      isAuthenticated: false,
      user: null,
    });
  },

  logout: () => {
    set({
      user: null,
      isAuthenticated: false,
      isDemoUser: false,
      error: null,
    });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  clearError: () => {
    set({ error: null });
  },

  setDemoUser: () => {
    set({
      user: {
        id: 'demo-user',
        name: 'Demo User',
        email: 'demo@vizly.ai',
        role: 'demo',
      },
      isAuthenticated: false,
      isDemoUser: true,
    });
  },

  addChat: (chat) => {
    const currentUser = get().user;
    if (currentUser) {
      set({
        user: {
          ...currentUser,
          chats: [chat, ...(currentUser.chats || [])],
        },
      });
    }
  },

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const response = await fetch('/api/auth/profile', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        set({
          user: data.user,
          isAuthenticated: true,
          isDemoUser: false,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
        });
      }
    } catch (error) {
      console.error('[Auth Check Error]:', error);
      set({
        user: null,
        isAuthenticated: false,
      });
    } finally {
      set({ isLoading: false });
    }
  },
}));
