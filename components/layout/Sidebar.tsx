"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDashboardStore } from "@/store/useDashboardStore";
import { LogoBadge } from "@/components/layout/LogoBadge";
import {
  LayoutDashboard, Database, History, Lightbulb, Settings,
  Menu, X, Trash2, Moon, Sun,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, darkMode, toggleDarkMode, conversationHistory, clearConversationHistory } = useDashboardStore();

  const links = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Data Sources", href: "/sources", icon: Database },
    { name: "Query History", href: "/history", icon: History },
    { name: "Insights", href: "/insights", icon: Lightbulb },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-5 left-4 z-50 p-2 rounded-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative z-40 inset-y-0 left-0
        flex h-screen w-64 flex-col border-r border-gray-200 dark:border-gray-800
        bg-white dark:bg-gray-950 px-3 py-4
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="mb-6">
          <LogoBadge size="md" showText />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => { if (window.innerWidth < 1024) setSidebarOpen(false); }}
                className={`flex items-center space-x-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <Icon className={`h-[18px] w-[18px] ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Recent Queries (mini history) */}
        {conversationHistory.length > 0 && (
          <div className="mt-4 px-3 py-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Recent</p>
              <button
                onClick={clearConversationHistory}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="Clear history"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-1">
              {conversationHistory.slice(-3).reverse().map((entry) => (
                <div
                  key={entry.id}
                  className="text-xs text-gray-500 dark:text-gray-400 truncate py-1 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 cursor-default"
                  title={entry.query}
                >
                  {entry.query}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom actions */}
        <div className="mt-auto px-3 py-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center space-x-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            {darkMode ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
          </button>
          <p className="text-[10px] text-gray-400 dark:text-gray-600 px-3">v0.2.0</p>
        </div>
      </div>
    </>
  );
}
