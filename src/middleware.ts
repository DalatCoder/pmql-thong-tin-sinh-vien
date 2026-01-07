import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // Dashboard routes require authentication
  const isDashboardRoute = nextUrl.pathname.startsWith("/dashboard");

  // API routes that require authentication (exclude v1 which uses API keys)
  const isProtectedApiRoute =
    nextUrl.pathname.startsWith("/api/") &&
    !nextUrl.pathname.startsWith("/api/auth") &&
    !nextUrl.pathname.startsWith("/api/v1");

  // Login page
  const isLoginPage = nextUrl.pathname === "/login";

  // If not logged in and trying to access protected routes
  if (!isLoggedIn && (isDashboardRoute || isProtectedApiRoute)) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If logged in and trying to access login page, redirect to dashboard
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/api/((?!auth|v1).*)",
  ],
};
