import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncClass, syncStudent, getSyncLogs } from "@/services/sync.service";
import { z } from "zod";

// Schema for sync request
const syncRequestSchema = z.object({
  type: z.enum(["class", "student"]),
  targetId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, targetId } = syncRequestSchema.parse(body);

    let result;

    if (type === "class") {
      result = await syncClass(targetId, session.user.id);
    } else {
      result = await syncStudent(targetId);
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Sync failed:", error);
    return NextResponse.json(
      { error: "Sync failed", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const syncType = searchParams.get("syncType") || undefined;

  try {
    const logs = await getSyncLogs({ page, limit, syncType });
    return NextResponse.json(logs);
  } catch (error) {
    console.error("Failed to fetch sync logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch sync logs" },
      { status: 500 }
    );
  }
}
