import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardTopBar from "@/components/DashboardTopBar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardSidebar />
      {/* offset for fixed sidebar */}
      <main className="flex-1 md:ml-60 pt-16 md:pt-0">
        <DashboardTopBar />
        {children}
      </main>
    </div>
  );
}
