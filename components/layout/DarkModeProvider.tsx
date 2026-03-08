"use client";

import { useEffect, useState } from "react";
import { useDashboardStore } from "@/store/useDashboardStore";

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const darkMode = useDashboardStore((s) => s.darkMode);
  const toggleDarkMode = useDashboardStore((s) => s.toggleDarkMode);
  const [mounted, setMounted] = useState(false);

  // Hydrate dark mode from localStorage AFTER mount (avoids SSR mismatch)
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("vizlyai-darkmode");
      if (saved === "true" && !darkMode) {
        toggleDarkMode(); // flip from false → true
      }
    } catch { /* ignore */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync dark class to <html>
  useEffect(() => {
    if (!mounted) return;
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode, mounted]);

  return <>{children}</>;
}
