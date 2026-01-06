import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const classData = await prisma.class.findUnique({
      where: { id },
      include: {
        students: {
          orderBy: { fullName: "asc" },
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
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...classData,
      studentCount: classData._count.students,
    });
  } catch (error) {
    console.error("Failed to fetch class:", error);
    return NextResponse.json(
      { error: "Failed to fetch class" },
      { status: 500 }
    );
  }
}
