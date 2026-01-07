import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

// Available permissions
export const AVAILABLE_PERMISSIONS = [
  { key: "read:students", label: "Đọc danh sách sinh viên" },
  { key: "read:classes", label: "Đọc danh sách lớp" },
] as const;

// GET - Lấy danh sách API keys
export async function GET() {
  try {
    const apiKeys = await prisma.apiKey.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        key: true,
        isActive: true,
        permissions: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });

    // Mask API keys (chỉ hiện 8 ký tự đầu)
    const maskedKeys = apiKeys.map((k) => ({
      ...k,
      maskedKey: `${k.key.slice(0, 8)}${"•".repeat(24)}`,
    }));

    return NextResponse.json({
      data: maskedKeys,
      permissions: AVAILABLE_PERMISSIONS,
    });
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return NextResponse.json(
      { error: "Không thể lấy danh sách API keys" },
      { status: 500 }
    );
  }
}

// POST - Tạo API key mới
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, permissions } = body as {
      name: string;
      permissions: string[];
    };

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Tên API key là bắt buộc" },
        { status: 400 }
      );
    }

    if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
      return NextResponse.json(
        { error: "Phải chọn ít nhất một quyền" },
        { status: 400 }
      );
    }

    // Generate unique API key
    const key = `sk_${randomBytes(32).toString("hex")}`;

    const apiKey = await prisma.apiKey.create({
      data: {
        name: name.trim(),
        key,
        permissions,
        isActive: true,
      },
    });

    // Return full key only on creation (không hiện lại sau này)
    return NextResponse.json({
      success: true,
      data: {
        id: apiKey.id,
        name: apiKey.name,
        key: apiKey.key, // Full key - chỉ hiện 1 lần
        permissions: apiKey.permissions,
        createdAt: apiKey.createdAt,
      },
      message: "Đã tạo API key. Lưu ý: Key chỉ hiện một lần, hãy copy ngay!",
    });
  } catch (error) {
    console.error("Error creating API key:", error);
    return NextResponse.json(
      { error: "Không thể tạo API key" },
      { status: 500 }
    );
  }
}
