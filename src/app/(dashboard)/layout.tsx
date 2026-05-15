import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTopBar from "@/components/DashboardTopBar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen overflow-hidden bg-gray-50 flex">
      <DashboardSidebar />
      <div className="flex flex-col flex-1 md:ml-60 overflow-hidden">
        {/* pt-16 offsets the fixed mobile top bar; removed on md+ */}
        <div className="shrink-0 pt-16 md:pt-0">
          <DashboardTopBar />
        </div>
        <main className="flex-1 overflow-y-auto min-h-0">
          {children}
        </main>
      </div>
    </div>
  );
}
