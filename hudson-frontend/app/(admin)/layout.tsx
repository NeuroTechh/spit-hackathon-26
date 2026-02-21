import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminGuard } from "@/components/admin-guard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div className="flex h-screen bg-[#FAFAFA]">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
        </main>
      </div>
    </AdminGuard>
  );
}
