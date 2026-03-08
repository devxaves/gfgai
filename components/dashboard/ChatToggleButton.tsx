"use client";

import { useDashboardStore } from "@/store/useDashboardStore";
import { MessageCircle } from "lucide-react";

export function ChatToggleButton() {
  const { chatPanelOpen, setChatPanelOpen, conversationHistory } = useDashboardStore();

  return (
    <button
      onClick={() => setChatPanelOpen(!chatPanelOpen)}
      className={`relative flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all ${
        chatPanelOpen
          ? 'bg-indigo-600 text-white shadow-sm'
          : 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
      title="Toggle chat panel"
    >
      <MessageCircle className="w-3.5 h-3.5" />
      <span>Chat</span>
      {conversationHistory.length > 0 && !chatPanelOpen && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
          {conversationHistory.length > 9 ? '9+' : conversationHistory.length}
        </span>
      )}
    </button>
  );
}
