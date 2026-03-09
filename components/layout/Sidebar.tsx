"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useDashboardStore } from "@/store/useDashboardStore";
import { useAuthStore } from "@/store/useAuthStore";
import { LogoBadge } from "@/components/layout/LogoBadge";
import {
  LayoutDashboard,
  Database,
  History,
  Lightbulb,
  Settings,
  Menu,
  X,
  Trash2,
  Moon,
  Sun,
  LogOut,
  Shield,
  User,
} from "lucide-react";

export function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    sidebarOpen,
    setSidebarOpen,
    darkMode,
    toggleDarkMode,
    conversationHistory,
    clearConversationHistory,
  } = useDashboardStore();
  const { user, isAuthenticated, isDemoUser, logout } = useAuthStore();

  const baseLinks = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Data Sources", href: "/sources", icon: Database },
    { name: "Insights", href: "/insights", icon: Lightbulb },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  // Add Query History only for authenticated users (not demo)
  const links =
    isAuthenticated && !isDemoUser
      ? [
          ...baseLinks.slice(0, 2),
          { name: "Query History", href: "/history", icon: History },
          ...baseLinks.slice(2),
        ]
      : baseLinks;

  return (
    <>
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`
        fixed lg:relative z-40 inset-y-0 left-0
        flex h-screen w-60 flex-col border-r border-gray-200 dark:border-gray-800
        bg-white dark:bg-gray-950 px-3 py-4
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="mb-5">
          <LogoBadge size="md" showText />
        </div>

        <nav className="flex-1 space-y-0.5">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => {
                  if (window.innerWidth < 1024) setSidebarOpen(false);
                }}
                className={`flex items-center space-x-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                <Icon
                  className={`h-[18px] w-[18px] ${isActive ? "text-indigo-600 dark:text-indigo-400" : ""}`}
                />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>

        {conversationHistory.length > 0 && isAuthenticated && !isDemoUser && (
          <div className="mt-3 px-2 py-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Recent
              </p>
              <button
                onClick={clearConversationHistory}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="Clear history"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-0.5">
              {conversationHistory
                .slice(-3)
                .reverse()
                .map((entry) => (
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

        <div className="mt-auto px-2 py-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
          {(isAuthenticated || isDemoUser) && user && (
            <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-lg p-3 border border-indigo-100 dark:border-indigo-900 mb-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">
                  {user.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .substring(0, 2)
                    .toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400 truncate">
                    {isDemoUser ? "Demo Account" : user.email}
                  </p>
                </div>
                {user.role === "admin" && (
                  <Shield className="w-3 h-3 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                )}
              </div>
              <div className="space-y-1">
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => {
                      if (window.innerWidth < 1024) setSidebarOpen(false);
                    }}
                    className="w-full block text-left px-2 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-300 bg-white dark:bg-gray-800/50 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                  >
                    Admin Panel
                  </Link>
                )}
                {isAuthenticated && !isDemoUser && (
                  <button
                    onClick={async () => {
                      await fetch("/api/auth/logout", {
                        method: "POST",
                        credentials: "include",
                      });
                      logout();
                      router.push("/auth");
                    }}
                    className="w-full text-left px-2 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 bg-white dark:bg-gray-800/50 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center gap-1"
                  >
                    <LogOut className="w-3 h-3" />
                    Sign Out
                  </button>
                )}
              </div>
            </div>
          )}

          {isDemoUser && (
            <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 border border-amber-100 dark:border-amber-900 mb-2">
              <p className="text-xs text-amber-800 dark:text-amber-200 font-medium mb-1">
                Sign in to your account for more functionality
              </p>
              <p className="text-[10px] text-amber-700 dark:text-amber-300">
                Save chats, access query history, and unlock all features
              </p>
              <button
                onClick={() => router.push("/auth")}
                className="mt-2 w-full text-left px-2 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-white dark:bg-gray-800/50 rounded hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
              >
                Sign In Now
              </button>
            </div>
          )}

          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center space-x-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            {darkMode ? (
              <Sun className="w-[18px] h-[18px]" />
            ) : (
              <Moon className="w-[18px] h-[18px]" />
            )}
            <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
          </button>
          <p className="text-[10px] text-gray-400 dark:text-gray-600 px-3">
            Viz.ai v1.0
          </p>
        </div>
      </div>
    </>
  );
}
