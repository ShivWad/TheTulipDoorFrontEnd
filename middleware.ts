import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Authentication & Authorization Middleware
 * 
 * This middleware protects routes by:
 * 1. Checking session existence for protected routes
 * 2. Verifying admin authorization using JWT (not DB)
 * 
 * Security: Uses cryptographically signed JWT session to determine
 * isAdmin status. The JWT is already validated by NextAuth, so we
 * don't need to query the database for every request.
 * 
 * Note: The isAdmin flag is added to the JWT in src/lib/auth.ts
 * via the jwt callback.
 */

export default auth(async (req) => {
  const isLoggedIn = !!req.auth;
  const isOnAccount = req.nextUrl.pathname.startsWith("/account");
  const isOnAdmin = req.nextUrl.pathname.startsWith("/admin");

  // 1. Protect admin routes - must be logged in
  if (isOnAdmin && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Check if user is admin using JWT (no database query)
  // The isAdmin flag is stored in the signed JWT token
  if (isOnAdmin && isLoggedIn) {
    // Type assertion: isAdmin is added to user in auth.ts callbacks
    const isAdmin = (req.auth?.user as any)?.isAdmin ?? false;
    
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }
  }

  // 3. Protect account routes - must be logged in
  if (isOnAccount && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/account/:path*",
    "/admin/:path*",
  ],
};