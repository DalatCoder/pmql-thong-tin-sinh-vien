import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication on server side
  const session = await auth();

  console.log("[Dashboard Layout] Session:", session ? "exists" : "null");

  if (!session?.user) {
    console.log("[Dashboard Layout] No session - redirecting to login");
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/30">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
