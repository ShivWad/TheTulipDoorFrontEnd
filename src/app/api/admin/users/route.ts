/**
 * Admin Users API
 * 
 * Admin-only endpoint for listing all users with pagination and search.
 * 
 * GET /api/admin/users
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - search: Search term for name or email (optional)
 * 
 * Security:
 * - Requires admin authentication (isAdmin: true)
 * - Rate limited: 5 requests per 15 minutes
 * 
 * Response:
 * - users: Array of user objects with subscription info
 * - totalPages: Total number of pages
 * - total: Total number of users matching filter
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * GET /api/admin/users
 * 
 * Fetch paginated list of all users.
 * Requires admin privileges.
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Check authentication (middleware already validates isAdmin for /admin/* routes)
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Rate limiting
    const ip = getClientIp(request);
    const { success } = rateLimit(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // 3. Parse pagination and search parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || "";
    const limit = 20;
    const skip = (page - 1) * limit;

    // 5. Build search filter
    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: "default" as const } },
            { name: { contains: search, mode: "default" as const } },
          ],
        }
      : {};

    // 6. Fetch users and total count in parallel
    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          isAdmin: true,
          createdAt: true,
          subscription: {
            select: {
              plan: true,
              status: true,
            },
          },
        },
      }),
      db.user.count({ where: where as any }),
    ]);

    // 7. Return paginated response
    return NextResponse.json({
      users,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    console.error("Admin users fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}