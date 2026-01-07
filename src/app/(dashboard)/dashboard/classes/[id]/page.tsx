import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Users,
  GraduationCap,
  Eye,
  Phone,
  Mail,
} from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClassDetailPage({ params }: Props) {
  const { id } = await params;

  const classData = await prisma.class.findUnique({
    where: { id },
    include: {
      students: {
        orderBy: [{ fullName: "asc" }],
        select: {
          id: true,
          studentId: true,
          fullName: true,
          gender: true,
          birthday: true,
          studyStatusName: true,
          specialtyName: true,
          schoolEmail: true,
          customPhone: true,
          portalPhone: true,
          fileImage: true,
        },
      },
      _count: {
        select: { students: true },
      },
    },
  });

  if (!classData) {
    notFound();
  }

  const maleCount = classData.students.filter((s: { gender: boolean }) => s.gender === true).length;
  const femaleCount = classData.students.filter((s: { gender: boolean }) => s.gender === false).length;

  const formatPhone = (student: { customPhone: string | null; portalPhone: string | null }) => {
    return student.customPhone || student.portalPhone || "—";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/classes">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Lớp {classData.classStudentId}
          </h2>
          <p className="text-slate-500">{classData.departmentName || "Khoa chưa xác định"}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Sĩ số</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classData._count.students}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Nam</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{maleCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Nữ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-600">{femaleCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Khóa</CardTitle>
            <GraduationCap className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{classData.courseName || classData.courseId || "—"}</div>
          </CardContent>
        </Card>
      </div>

      {/* Class info */}
      {classData.advisorName && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Thông tin lớp</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <span className="text-sm text-slate-500">Cố vấn học tập</span>
                <p className="font-medium">{classData.advisorName}</p>
              </div>
              {classData.advisorId && (
                <div>
                  <span className="text-sm text-slate-500">Mã CVHT</span>
                  <p className="font-medium">{classData.advisorId}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Students table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Danh sách sinh viên ({classData._count.students})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {classData.students.length === 0 ? (
            <p className="py-8 text-center text-slate-500">
              Chưa có sinh viên trong lớp này
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">STT</TableHead>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Sinh viên</TableHead>
                  <TableHead>Giới tính</TableHead>
                  <TableHead>Chuyên ngành</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Liên hệ</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classData.students.map((student, index) => (
                  <TableRow key={student.id}>
                    <TableCell className="text-slate-500">{index + 1}</TableCell>
                    <TableCell>
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={student.fileImage ? `https://portal-api.dlu.edu.vn${student.fileImage}` : ""}
                        />
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {student.fullName.charAt(student.fullName.lastIndexOf(" ") + 1)}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-slate-900">{student.fullName}</div>
                        <div className="text-sm text-slate-500">{student.studentId}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={student.gender ? "default" : "secondary"}>
                        {student.gender ? "Nam" : "Nữ"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{student.specialtyName || "Chưa chọn"}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          student.studyStatusName === "Còn học"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }
                      >
                        {student.studyStatusName || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-1 text-slate-600">
                          <Phone className="h-3 w-3" />
                          {formatPhone(student)}
                        </div>
                        {student.schoolEmail && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <Mail className="h-3 w-3" />
                            <span className="truncate max-w-[150px]">{student.schoolEmail}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dashboard/students/${student.id}`}>
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
