import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  checkRateLimit,
  getRateLimitHeaders,
  DEFAULT_RATE_LIMIT,
} from "@/lib/rate-limit";

/**
 * External API v1 - Students
 * Authentication: API Key in X-API-Key header
 * Rate Limit: 100 requests per minute per API key
 */

async function validateApiKey(request: NextRequest): Promise<string | null> {
  const apiKey = request.headers.get("X-API-Key");

  if (!apiKey) {
    return null;
  }

  const key = await prisma.apiKey.findUnique({
    where: { key: apiKey },
  });

  if (!key || !key.isActive) {
    return null;
  }

  // Check if key has required permission
  if (!key.permissions.includes("read:students")) {
    return null;
  }

  // Update last used
  await prisma.apiKey.update({
    where: { id: key.id },
    data: { lastUsedAt: new Date() },
  });

  return key.id; // Return key ID for rate limiting
}

export async function GET(request: NextRequest) {
  const keyId = await validateApiKey(request);

  if (!keyId) {
    return NextResponse.json(
      { error: "Unauthorized", message: "Invalid or missing API key" },
      { status: 401 }
    );
  }

  // Check rate limit
  const rateLimitResult = checkRateLimit(keyId, DEFAULT_RATE_LIMIT);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        error: "Too Many Requests",
        message: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfterSeconds} seconds.`,
        retryAfter: rateLimitResult.retryAfterSeconds,
      },
      {
        status: 429,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const classId = searchParams.get("classId") || "";
  const departmentId = searchParams.get("departmentId") || "";

  const skip = (page - 1) * limit;

  // Build where clause
  const where: Record<string, unknown> = {};

  if (classId) {
    where.classStudentId = classId;
  }

  if (departmentId) {
    where.departmentId = departmentId;
  }

  try {
    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        orderBy: [{ classStudentId: "asc" }, { fullName: "asc" }],
        skip,
        take: limit,
        select: {
          studentId: true,
          fullName: true,
          firstName: true,
          lastName: true,
          gender: true,
          birthday: true,
          classStudentId: true,
          departmentId: true,
          departmentName: true,
          ologyName: true,
          studyStatusId: true,
          studyStatusName: true,
          specialtyCode: true,
          specialtyName: true,
          enrollYear: true,
          schoolEmail: true,
          customPhone: true,
          temporaryAddress: true,
          permanentAddress: true,
          lastSyncedAt: true,
        },
      }),
      prisma.student.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: students,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("External API - Failed to fetch students:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
