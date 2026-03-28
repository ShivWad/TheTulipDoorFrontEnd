/**
 * Admin Orders API
 * 
 * Admin-only endpoint for viewing all orders.
 * 
 * GET /api/admin/orders
 * 
 * Query Parameters:
 * - filter: Filter by order type (all | subscription | gift)
 * - page: Page number (default: 1)
 * 
 * Security:
 * - Requires admin authentication (isAdmin: true)
 * - Rate limited: 5 requests per 15 minutes
 * 
 * Response:
 * - orders: Array of order objects with user and subscription info
 * - totalPages: Total number of pages
 * - total: Total number of orders matching filter
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * GET /api/admin/orders
 * 
 * Fetch paginated list of all orders with optional filtering.
 * Requires admin privileges.
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Check authentication (middleware already validates isAdmin for /admin/* routes)
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Secondary authorization check
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true },
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 2. Rate limiting
    const ip = getClientIp(request);
    const { success } = rateLimit(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;
    const skip = (page - 1) * limit;

    // 4. Build filter
    let where = {};
    
    if (filter === "subscription") {
      where = { orderType: "subscription" };
    } else if (filter === "gift") {
      where = { orderType: "gift" };
    }

    // 5. Fetch orders and total count
    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
          subscription: {
            select: {
              plan: true,
            },
          },
        },
      }),
      db.order.count({ where }),
    ]);

    // 7. Return paginated response
    return NextResponse.json({
      orders,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    console.error("Admin orders fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}