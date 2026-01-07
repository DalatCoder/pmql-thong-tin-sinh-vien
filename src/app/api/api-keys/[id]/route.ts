import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

// PATCH - Cập nhật trạng thái API key (enable/disable)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isActive } = body as { isActive: boolean };

    const existing = await prisma.apiKey.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "API key không tồn tại" },
        { status: 404 }
      );
    }

    const updated = await prisma.apiKey.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        isActive: updated.isActive,
      },
      message: updated.isActive ? "Đã kích hoạt API key" : "Đã vô hiệu hóa API key",
    });
  } catch (error) {
    console.error("Error updating API key:", error);
    return NextResponse.json(
      { error: "Không thể cập nhật API key" },
      { status: 500 }
    );
  }
}

// DELETE - Xóa API key
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.apiKey.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "API key không tồn tại" },
        { status: 404 }
      );
    }

    await prisma.apiKey.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Đã xóa API key",
    });
  } catch (error) {
    console.error("Error deleting API key:", error);
    return NextResponse.json(
      { error: "Không thể xóa API key" },
      { status: 500 }
    );
  }
}
