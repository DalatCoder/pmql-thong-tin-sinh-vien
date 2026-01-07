import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  checkRateLimit,
  getRateLimitHeaders,
  DEFAULT_RATE_LIMIT,
} from "@/lib/rate-limit";

/**
 * External API v1 - Get student by studentId
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

  if (!key.permissions.includes("read:students")) {
    return null;
  }

  await prisma.apiKey.update({
    where: { id: key.id },
    data: { lastUsedAt: new Date() },
  });

  return key.id;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const keyId = await validateApiKey(request);

  if (!keyId) {
    return NextResponse.json(
      { success: false, error: "Unauthorized", message: "Invalid or missing API key" },
      { status: 401 }
    );
  }

  // Check rate limit
  const rateLimitResult = checkRateLimit(keyId, DEFAULT_RATE_LIMIT);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      {
        success: false,
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

  const { studentId } = await params;

  try {
    const student = await prisma.student.findUnique({
      where: { studentId },
      select: {
        studentId: true,
        fullName: true,
        firstName: true,
        lastName: true,
        gender: true,
        birthday: true,
        birthPlace: true,
        ethnicName: true,
        idCard: true,
        classStudentId: true,
        departmentId: true,
        departmentName: true,
        ologyId: true,
        ologyName: true,
        courseId: true,
        courseName: true,
        studyStatusId: true,
        studyStatusName: true,
        specialtyCode: true,
        specialtyName: true,
        enrollYear: true,
        schoolEmail: true,
        customPhone: true,
        portalPhone: true,
        portalEmail: true,
        temporaryAddress: true,
        permanentAddress: true,
        portalAddress: true,
        fatherName: true,
        motherName: true,
        contactPersonName: true,
        contactPersonPhone: true,
        emergencyContact: true,
        emergencyPhone: true,
        lastSyncedAt: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: "Student not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error("External API - Failed to fetch student:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
