import { Sidebar } from "@/components/layout/Sidebar";
import { QueryInput } from "@/components/dashboard/QueryInput";
import { Workspace } from "@/components/dashboard/Workspace";
import { DatasetUploader } from "@/components/dashboard/DatasetUploader";
import { DataSourceSelector } from "@/components/dashboard/DataSourceSelector";
import { ChatPanel } from "@/components/dashboard/ChatPanel";
import { ChatToggleButton } from "@/components/dashboard/ChatToggleButton";

export default function DashboardPage() {
  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl shrink-0 z-10">
          {/* Data source selector row */}
          <div className="flex items-center justify-center gap-2 px-4 lg:px-6 py-1.5 border-b border-gray-100 dark:border-gray-800/50">
            <DataSourceSelector />
          </div>
          {/* Query input row */}
          <div className="flex items-center px-4 lg:px-6 py-2 gap-3">
            <div className="w-10 lg:hidden" />
            <div className="flex-1 flex justify-center">
              <QueryInput />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <DatasetUploader />
              <ChatToggleButton />
            </div>
          </div>
        </header>
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-auto p-4 lg:p-6">
            <Workspace />
          </main>
          <ChatPanel />
        </div>
      </div>
    </div>
  );
}
