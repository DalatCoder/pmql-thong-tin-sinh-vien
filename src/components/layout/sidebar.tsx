"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  GraduationCap,
  RefreshCcw,
  LayoutDashboard,
  Settings,
  LogOut,
  Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut, useSession } from "next-auth/react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "text-violet-500", bgColor: "bg-violet-100" },
  { name: "Sinh viên", href: "/dashboard/students", icon: Users, color: "text-blue-500", bgColor: "bg-blue-100" },
  { name: "Lớp học", href: "/dashboard/classes", icon: GraduationCap, color: "text-emerald-500", bgColor: "bg-emerald-100" },
  { name: "Đồng bộ", href: "/dashboard/sync", icon: RefreshCcw, color: "text-orange-500", bgColor: "bg-orange-100" },
  { name: "API Keys", href: "/dashboard/api-keys", icon: Key, color: "text-rose-500", bgColor: "bg-rose-100" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Fix: Dashboard chỉ active khi đúng /dashboard, các trang khác dùng startsWith
  const isRouteActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-slate-200">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6 border-b border-slate-100">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-200">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900">PMQL</span>
          <span className="text-xs text-slate-500">Thông tin Sinh viên</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = isRouteActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? `${item.bgColor} ${item.color} shadow-sm`
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                isActive ? "bg-white/60" : "bg-slate-100"
              )}>
                <item.icon className={cn("h-4 w-4", isActive ? item.color : "text-slate-500")} />
              </div>
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-slate-100 p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-left hover:bg-slate-50 rounded-xl h-auto py-3"
            >
              <Avatar className="h-9 w-9 ring-2 ring-slate-100">
                <AvatarImage src={session?.user?.image || ""} />
                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-medium">
                  {session?.user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-medium text-slate-900">
                  {session?.user?.name || "Người dùng"}
                </span>
                <span className="truncate text-xs text-slate-500">
                  {session?.user?.email || ""}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Tài khoản</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Cài đặt
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
