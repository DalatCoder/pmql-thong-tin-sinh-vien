import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GraduationCap, Users, Eye, RefreshCcw } from "lucide-react";

async function getClasses() {
  return prisma.class.findMany({
    orderBy: { classStudentId: "asc" },
    include: {
      _count: {
        select: { students: true },
      },
    },
  });
}

async function getStats() {
  const [totalClasses, totalStudents] = await Promise.all([
    prisma.class.count(),
    prisma.student.count(),
  ]);
  return { totalClasses, totalStudents };
}

export default async function ClassesPage() {
  const [classes, stats] = await Promise.all([getClasses(), getStats()]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Quản lý Lớp học</h2>
          <p className="text-slate-500">Xem danh sách lớp và sinh viên</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/sync">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Đồng bộ dữ liệu
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Tổng số lớp
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClasses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">
              Tổng sinh viên
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
          </CardContent>
        </Card>
      </div>

      {/* Classes table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Danh sách lớp</CardTitle>
        </CardHeader>
        <CardContent>
          {classes.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              <GraduationCap className="mx-auto h-12 w-12 text-slate-300" />
              <p className="mt-2">Chưa có dữ liệu lớp học</p>
              <p className="text-sm">Vào trang Đồng bộ để lấy dữ liệu từ Portal</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã lớp</TableHead>
                  <TableHead>Khoa</TableHead>
                  <TableHead>Khóa</TableHead>
                  <TableHead>CVHT</TableHead>
                  <TableHead className="text-center">Sĩ số</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell>
                      <div className="font-medium">{cls.classStudentId}</div>
                      <div className="text-sm text-slate-500">{cls.className}</div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{cls.departmentName || "—"}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{cls.courseName || cls.courseId || "—"}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{cls.advisorName || "—"}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-blue-100 text-blue-700">
                        {cls._count.students} SV
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/classes/${cls.id}`}>
                          <Eye className="mr-1 h-4 w-4" />
                          Xem
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
