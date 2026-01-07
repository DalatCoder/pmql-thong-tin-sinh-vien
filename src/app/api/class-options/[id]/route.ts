import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// DELETE /api/class-options/[id] - Xóa class option
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Kiểm tra tồn tại
    const existing = await prisma.classOption.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Class option không tồn tại" },
        { status: 404 }
      );
    }

    await prisma.classOption.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting class option:", error);
    return NextResponse.json(
      { error: "Không thể xóa class option" },
      { status: 500 }
    );
  }
}
