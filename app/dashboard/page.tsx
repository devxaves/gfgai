import { Sidebar } from "@/components/layout/Sidebar";
import { QueryInput } from "@/components/dashboard/QueryInput";
import { Workspace } from "@/components/dashboard/Workspace";
import { DatasetUploader } from "@/components/dashboard/DatasetUploader";

export default function DashboardPage() {
  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-gray-950">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl flex items-center px-4 lg:px-6 shrink-0 z-10 gap-3">
          <div className="w-10 lg:hidden" />
          <div className="flex-1 flex justify-center">
            <QueryInput />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <DatasetUploader />
            {/* <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-white text-[11px] font-bold shadow-sm">
              AI
            </div> */}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <Workspace />
        </main>
      </div>
    </div>
  );
}
