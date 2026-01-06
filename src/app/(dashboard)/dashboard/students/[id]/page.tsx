import { notFound } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  Calendar,
  GraduationCap,
  Users,
  Edit
} from "lucide-react";
import { StudentEditForm } from "@/components/features/students/student-edit-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function StudentDetailPage({ params }: Props) {
  const { id } = await params;

  const student = await prisma.student.findUnique({
    where: { id },
    include: { class: true },
  });

  if (!student) {
    notFound();
  }

  const formatDate = (date: Date | null) => {
    if (!date) return "—";
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/students">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Chi tiết Sinh viên</h2>
          <p className="text-slate-500">Xem và cập nhật thông tin bổ sung</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - Basic info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage
                    src={student.fileImage ? `https://portal-api.dlu.edu.vn${student.fileImage}` : ""}
                  />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl">
                    {student.fullName.charAt(student.fullName.lastIndexOf(" ") + 1)}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl font-bold text-slate-900">{student.fullName}</h3>
                <p className="text-slate-500">{student.studentId}</p>
                <div className="flex gap-2 mt-3">
                  <Badge variant={student.gender ? "default" : "secondary"}>
                    {student.gender ? "Nam" : "Nữ"}
                  </Badge>
                  <Badge
                    className={
                      student.studyStatusName === "Còn học"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }
                  >
                    {student.studyStatusName || "—"}
                  </Badge>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">{student.schoolEmail || "—"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">
                    {student.customPhone || student.portalPhone || "—"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">{formatDate(student.birthday)}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-600">{student.birthPlace || "—"}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Academic info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Thông tin học tập
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Khoa</span>
                <span className="text-sm font-medium">{student.departmentName || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Ngành</span>
                <span className="text-sm font-medium">{student.ologyName || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Lớp</span>
                <span className="text-sm font-medium">{student.classStudentId || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Chuyên ngành</span>
                <span className="text-sm font-medium">{student.specialtyName || "Chưa chọn"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Khóa</span>
                <span className="text-sm font-medium">{student.courseName || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Năm nhập học</span>
                <span className="text-sm font-medium">{student.enrollYear || "—"}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Editable info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Family info from Portal */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Thông tin gia đình (từ Portal)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="text-sm text-slate-500">Họ tên cha</span>
                  <p className="font-medium">{student.fatherName || "—"}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">Họ tên mẹ</span>
                  <p className="font-medium">{student.motherName || "—"}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">Người liên hệ</span>
                  <p className="font-medium">{student.contactPersonName || "—"}</p>
                </div>
                <div>
                  <span className="text-sm text-slate-500">SĐT liên hệ</span>
                  <p className="font-medium">{student.contactPersonPhone || "—"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Editable custom fields */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Thông tin bổ sung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StudentEditForm
                studentId={student.id}
                initialData={{
                  customPhone: student.customPhone,
                  temporaryAddress: student.temporaryAddress,
                  permanentAddress: student.permanentAddress,
                  emergencyContact: student.emergencyContact,
                  emergencyPhone: student.emergencyPhone,
                  notes: student.notes,
                }}
              />
            </CardContent>
          </Card>

          {/* Sync info */}
          <div className="text-sm text-slate-400">
            Đồng bộ lần cuối: {student.lastSyncedAt ? formatDate(student.lastSyncedAt) : "Chưa đồng bộ"}
          </div>
        </div>
      </div>
    </div>
  );
}
