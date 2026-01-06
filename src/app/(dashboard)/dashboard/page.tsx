import { Users, GraduationCap, RefreshCcw, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import prisma from "@/lib/prisma";

async function getStats() {
  const [totalStudents, totalClasses, activeStudents, recentSyncs] = await Promise.all([
    prisma.student.count(),
    prisma.class.count(),
    prisma.student.count({ where: { studyStatusId: "1" } }),
    prisma.syncLog.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
  ]);

  return { totalStudents, totalClasses, activeStudents, recentSyncs };
}

export default async function DashboardPage() {
  const stats = await getStats();

  const statCards = [
    {
      title: "Tổng sinh viên",
      value: stats.totalStudents,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Đang học",
      value: stats.activeStudents,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Lớp học",
      value: stats.totalClasses,
      icon: GraduationCap,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Đồng bộ (7 ngày)",
      value: stats.recentSyncs,
      icon: RefreshCcw,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-slate-500">Tổng quan hệ thống quản lý thông tin sinh viên</p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hành động nhanh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <a
              href="/dashboard/students"
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-slate-50"
            >
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <div className="font-medium">Quản lý sinh viên</div>
                <div className="text-sm text-slate-500">Xem và cập nhật thông tin sinh viên</div>
              </div>
            </a>
            <a
              href="/dashboard/sync"
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-slate-50"
            >
              <RefreshCcw className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium">Đồng bộ dữ liệu</div>
                <div className="text-sm text-slate-500">Đồng bộ từ Portal DLU</div>
              </div>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hướng dẫn sử dụng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <p>
              <strong>1. Đồng bộ dữ liệu:</strong> Vào trang Đồng bộ để cập nhật thông tin sinh viên từ Portal.
            </p>
            <p>
              <strong>2. Cập nhật thông tin:</strong> Bổ sung SĐT, địa chỉ tạm trú, ghi chú cho từng sinh viên.
            </p>
            <p>
              <strong>3. Tìm kiếm:</strong> Sử dụng thanh tìm kiếm để tìm sinh viên theo tên hoặc mã SV.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
