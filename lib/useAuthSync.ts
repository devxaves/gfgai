import { useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useDashboardStore } from '@/store/useDashboardStore';

export function useAuthSync() {
  const { isAuthenticated } = useAuthStore();
  const { conversationHistory, addConversation } = useDashboardStore();

  const saveChat = useCallback(async (chatId: string, title: string, summary?: string) => {
    if (!isAuthenticated) return;

    try {
      const response = await fetch('/api/auth/chats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ chatId, title, summary }),
      });

      if (!response.ok) {
        console.error('Failed to save chat');
      }
    } catch (error) {
      console.error('[Save Chat Error]:', error);
    }
  }, [isAuthenticated]);

  const loadChats = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await fetch('/api/auth/chats', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        return data.chats;
      }
    } catch (error) {
      console.error('[Load Chats Error]:', error);
    }
  }, [isAuthenticated]);

  return { saveChat, loadChats };
}
