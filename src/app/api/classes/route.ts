import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const departmentId = searchParams.get("departmentId") || "";

  const skip = (page - 1) * limit;

  // Build where clause
  const where: Record<string, unknown> = {};

  if (search) {
    where.OR = [
      { classStudentId: { contains: search, mode: "insensitive" } },
      { className: { contains: search, mode: "insensitive" } },
    ];
  }

  if (departmentId) {
    where.departmentId = departmentId;
  }

  try {
    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where,
        orderBy: { classStudentId: "asc" },
        skip,
        take: limit,
        include: {
          _count: {
            select: { students: true },
          },
        },
      }),
      prisma.class.count({ where }),
    ]);

    // Transform to include student count
    const data = classes.map((cls) => ({
      id: cls.id,
      classStudentId: cls.classStudentId,
      className: cls.className,
      departmentId: cls.departmentId,
      departmentName: cls.departmentName,
      courseId: cls.courseId,
      courseName: cls.courseName,
      advisorId: cls.advisorId,
      advisorName: cls.advisorName,
      studentCount: cls._count.students,
      createdAt: cls.createdAt,
      updatedAt: cls.updatedAt,
    }));

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    );
  }
}
