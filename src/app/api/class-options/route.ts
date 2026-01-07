import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/class-options - Lấy danh sách class options
export async function GET() {
  try {
    const classOptions = await prisma.classOption.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: "asc" }, { classStudentId: "asc" }],
    });

    return NextResponse.json(classOptions);
  } catch (error) {
    console.error("Error fetching class options:", error);
    return NextResponse.json(
      { error: "Không thể lấy danh sách class options" },
      { status: 500 }
    );
  }
}

// POST /api/class-options - Thêm class option mới
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { classStudentId, description } = body;

    if (!classStudentId || typeof classStudentId !== "string") {
      return NextResponse.json(
        { error: "Mã lớp (classStudentId) là bắt buộc" },
        { status: 400 }
      );
    }

    // Kiểm tra trùng
    const existing = await prisma.classOption.findUnique({
      where: { classStudentId: classStudentId.trim().toUpperCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Mã lớp này đã tồn tại" },
        { status: 400 }
      );
    }

    // Lấy displayOrder lớn nhất
    const maxOrder = await prisma.classOption.aggregate({
      _max: { displayOrder: true },
    });

    const classOption = await prisma.classOption.create({
      data: {
        classStudentId: classStudentId.trim().toUpperCase(),
        description: description?.trim() || null,
        displayOrder: (maxOrder._max.displayOrder ?? 0) + 1,
      },
    });

    return NextResponse.json(classOption, { status: 201 });
  } catch (error) {
    console.error("Error creating class option:", error);
    return NextResponse.json(
      { error: "Không thể tạo class option" },
      { status: 500 }
    );
  }
}
