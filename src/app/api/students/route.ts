import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const classId = searchParams.get("classId") || "";
  const departmentId = searchParams.get("departmentId") || "";
  const studyStatus = searchParams.get("studyStatus") || "";

  const skip = (page - 1) * limit;

  // Build where clause
  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { studentId: { contains: search, mode: "insensitive" } },
      { schoolEmail: { contains: search, mode: "insensitive" } },
    ];
  }

  if (classId) {
    where.classStudentId = classId;
  }

  if (departmentId) {
    where.departmentId = departmentId;
  }

  if (studyStatus) {
    where.studyStatusId = studyStatus;
  }

  try {
    const [students, total] = await Promise.all([
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
    ]);

    return NextResponse.json({
      data: students,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}
