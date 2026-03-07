import { Sidebar } from "@/components/layout/Sidebar";
import { QueryInput } from "@/components/dashboard/QueryInput";
import { Workspace } from "@/components/dashboard/Workspace";
import { DatasetUploader } from "@/components/dashboard/DatasetUploader";

export default function Home() {
  return (
    <div className="flex h-screen w-full bg-slate-50">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        
        <header className="h-[72px] border-b bg-white flex items-center px-6 shrink-0 shadow-sm z-10">
          <div className="flex-1 flex justify-center lg:justify-start lg:pl-10">
            <QueryInput />
          </div>
          <div className="flex items-center space-x-4 pl-4">
            <DatasetUploader />
            <div className="w-9 h-9 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold border-2 border-white ring-2 ring-gray-100 shadow-sm">
              CX
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 bg-slate-50/50">
          <Workspace />
        </main>
      </div>
    </div>
  );
}
