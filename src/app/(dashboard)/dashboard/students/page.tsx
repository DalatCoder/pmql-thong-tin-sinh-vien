import prisma from "@/lib/prisma";
import { StudentsTable } from "@/components/features/students/students-table";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{
    search?: string;
    classId?: string;
    page?: string;
  }>;
}

export default async function StudentsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  // Build where clause
  const where: Record<string, unknown> = {};

  if (params.search) {
    where.OR = [
      { fullName: { contains: params.search, mode: "insensitive" } },
      { studentId: { contains: params.search, mode: "insensitive" } },
    ];
  }

  if (params.classId) {
    where.classStudentId = params.classId;
  }

  // Fetch data
  const [students, total, classes] = await Promise.all([
    prisma.student.findMany({
      where,
      orderBy: [{ classStudentId: "asc" }, { fullName: "asc" }],
      skip,
      take: limit,
      select: {
        id: true,
        studentId: true,
        fullName: true,
        gender: true,
        birthday: true,
        classStudentId: true,
        departmentName: true,
        studyStatusName: true,
        specialtyName: true,
        schoolEmail: true,
        customPhone: true,
        portalPhone: true,
        fileImage: true,
        lastSyncedAt: true,
      },
    }),
    prisma.student.count({ where }),
    prisma.class.findMany({
      select: { classStudentId: true },
      orderBy: { classStudentId: "asc" },
    }),
  ]);

  const data = {
    data: students.map((s) => ({
      ...s,
      birthday: s.birthday?.toISOString() || null,
      lastSyncedAt: s.lastSyncedAt?.toISOString() || null,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Quản lý Sinh viên</h2>
        <p className="text-slate-500">Xem và cập nhật thông tin sinh viên</p>
      </div>

      <StudentsTable initialData={data} classes={classes} />
    </div>
  );
}
