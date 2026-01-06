import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncClass, syncStudent, getSyncLogs } from "@/services/sync.service";
import { getPortalToken } from "@/lib/portal-api";
import { z } from "zod";

// Schema for sync request
const syncRequestSchema = z.object({
  type: z.enum(["class", "student"]),
  targetId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  console.log("[Sync API] POST request received");

  // Kiểm tra Portal token trước
  const portalToken = await getPortalToken();
  console.log("[Sync API] Portal token exists:", !!portalToken);

  if (!portalToken) {
    console.log("[Sync API] No portal token - returning 401");
    return NextResponse.json(
      { error: "Chưa đăng nhập Portal", message: "Vui lòng đăng nhập Portal trước khi đồng bộ" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    console.log("[Sync API] Request body:", body);

    const { type, targetId } = syncRequestSchema.parse(body);
    console.log("[Sync API] Sync type:", type, "Target:", targetId);

    let result;

    if (type === "class") {
      console.log("[Sync API] Starting class sync for:", targetId);
      result = await syncClass(targetId, "portal-user");
    } else {
      console.log("[Sync API] Starting student sync for:", targetId);
      result = await syncStudent(targetId);
    }

    console.log("[Sync API] Sync result:", JSON.stringify(result, null, 2));
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("[Sync API] Validation error:", error.issues);
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }

    console.error("[Sync API] Sync failed:", error);
    console.error("[Sync API] Error stack:", error instanceof Error ? error.stack : "No stack");
    
    return NextResponse.json(
      { 
        error: "Sync failed", 
        message: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  console.log("[Sync API] GET request received");

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const syncType = searchParams.get("syncType") || undefined;

  try {
    const logs = await getSyncLogs({ page, limit, syncType });
    return NextResponse.json(logs);
  } catch (error) {
    console.error("[Sync API] Failed to fetch sync logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch sync logs" },
      { status: 500 }
    );
  }
}
