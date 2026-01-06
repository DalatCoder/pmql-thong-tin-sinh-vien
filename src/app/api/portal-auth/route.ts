import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const PORTAL_BASE_URL = "https://portal-api.dlu.edu.vn/api";
const PORTAL_API_KEY = process.env.PORTAL_API_KEY;
const PORTAL_CLIENT_ID = process.env.PORTAL_CLIENT_ID || "vhu";

// Cookie name để lưu token
const PORTAL_TOKEN_COOKIE = "portal_token";
const PORTAL_TOKEN_EXPIRES_COOKIE = "portal_token_expires";

export async function POST(request: NextRequest) {
  console.log("[Portal Auth] POST request received");
  
  try {
    // Kiểm tra env variables
    if (!PORTAL_API_KEY) {
      console.error("[Portal Auth] PORTAL_API_KEY is not set!");
      return NextResponse.json(
        { error: "Server configuration error: PORTAL_API_KEY is not set" },
        { status: 500 }
      );
    }

    const body = await request.json();
    console.log("[Portal Auth] Request body:", { username: body.username, password: "***" });
    
    const { username, password } = body;

    if (!username || !password) {
      console.log("[Portal Auth] Missing username or password");
      return NextResponse.json(
        { error: "Vui lòng nhập tài khoản và mật khẩu" },
        { status: 400 }
      );
    }

    // Gọi API đăng nhập Portal
    console.log("[Portal Auth] Calling Portal API...");
    console.log("[Portal Auth] URL:", `${PORTAL_BASE_URL}/authenticate/authpsc`);
    
    const response = await fetch(`${PORTAL_BASE_URL}/authenticate/authpsc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: PORTAL_API_KEY,
        clientid: PORTAL_CLIENT_ID,
      },
      body: JSON.stringify({
        username,
        password,
        type: 0,
      }),
    });

    console.log("[Portal Auth] Portal response status:", response.status);

    if (!response.ok) {
      const text = await response.text();
      console.error("[Portal Auth] Portal login failed:", response.status, text);
      return NextResponse.json(
        { error: "Đăng nhập Portal thất bại. Vui lòng kiểm tra tài khoản.", details: text },
        { status: 401 }
      );
    }

    const data = await response.json();
    console.log("[Portal Auth] Portal response:", JSON.stringify(data, null, 2));

    // Response format: { Token, FullName, Role, IsLogin, Expire, ... }
    if (!data.Token) {
      console.error("[Portal Auth] No Token in response:", data);
      return NextResponse.json(
        { error: "Không nhận được token từ Portal", details: data.Message || "Unknown error" },
        { status: data.IsLogin === false ? 401 : 500 }
      );
    }

    console.log("[Portal Auth] Token received, length:", data.Token.length);

    // Lấy thông tin user từ response (không cần decode JWT)
    const userInfo = {
      name: data.FullName || "Người dùng",
      id: data.Id || "",
      role: data.Role || "",
    };

    // Lưu token vào cookie (httpOnly để bảo mật)
    // Sử dụng Expire từ response nếu có, không thì mặc định 2 giờ
    const expiresAt = data.Expire ? new Date(data.Expire) : new Date(Date.now() + 2 * 60 * 60 * 1000);
    
    console.log("[Portal Auth] Setting cookies, expires:", expiresAt.toISOString());
    const cookieStore = await cookies();
    cookieStore.set(PORTAL_TOKEN_COOKIE, data.Token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
    });
    
    cookieStore.set(PORTAL_TOKEN_EXPIRES_COOKIE, expiresAt.toISOString(), {
      httpOnly: false, // Client cần đọc để hiển thị
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
    });

    console.log("[Portal Auth] Login successful for:", userInfo.name);
    return NextResponse.json({
      success: true,
      user: userInfo,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("[Portal Auth] Error:", error);
    console.error("[Portal Auth] Error stack:", error instanceof Error ? error.stack : "No stack");
    return NextResponse.json(
      { error: "Có lỗi xảy ra khi đăng nhập", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Kiểm tra trạng thái đăng nhập Portal
export async function GET() {
  console.log("[Portal Auth] GET request - checking auth status");
  
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(PORTAL_TOKEN_COOKIE)?.value;
    const expiresAt = cookieStore.get(PORTAL_TOKEN_EXPIRES_COOKIE)?.value;

    console.log("[Portal Auth] Token exists:", !!token, "Expires:", expiresAt);

    if (!token || !expiresAt) {
      return NextResponse.json({ authenticated: false });
    }

    // Kiểm tra token còn hạn không
    if (new Date(expiresAt) < new Date()) {
      console.log("[Portal Auth] Token expired");
      return NextResponse.json({ authenticated: false, expired: true });
    }

    // Decode JWT để lấy thông tin user
    const tokenParts = token.split(".");
    let userInfo = { name: "Người dùng", id: "" };
    
    if (tokenParts.length === 3) {
      try {
        const payload = JSON.parse(Buffer.from(tokenParts[1], "base64").toString());
        userInfo = {
          name: payload.Name || "Người dùng",
          id: payload.Id || "",
        };
      } catch (e) {
        // Ignore
      }
    }

    return NextResponse.json({
      authenticated: true,
      user: userInfo,
      expiresAt,
    });
  } catch (error) {
    console.error("[Portal Auth] GET error:", error);
    return NextResponse.json({ authenticated: false, error: String(error) });
  }
}

// Đăng xuất Portal
export async function DELETE() {
  console.log("[Portal Auth] DELETE request - logging out");
  
  try {
    const cookieStore = await cookies();
    cookieStore.delete(PORTAL_TOKEN_COOKIE);
    cookieStore.delete(PORTAL_TOKEN_EXPIRES_COOKIE);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Portal Auth] DELETE error:", error);
    return NextResponse.json({ success: false, error: String(error) });
  }
}
