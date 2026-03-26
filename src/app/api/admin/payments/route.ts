/**
 * Admin Payments API
 * 
 * Admin-only endpoint for viewing all payment transactions.
 * 
 * GET /api/admin/payments
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * 
 * Security:
 * - Requires admin authentication (isAdmin: true)
 * - Rate limited: 5 requests per 15 minutes
 * 
 * Response:
 * - payments: Array of payment objects with user info
 * - totalPages: Total number of pages
 * - total: Total number of payments
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

/**
 * GET /api/admin/payments
 * 
 * Fetch paginated list of all payment transactions.
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

    // 3. Parse pagination parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;
    const skip = (page - 1) * limit;

    // 4. Fetch payments and total count
    const [payments, total] = await Promise.all([
      db.payment.findMany({
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
        },
      }),
      db.payment.count(),
    ]);

    // 6. Return paginated response
    return NextResponse.json({
      payments,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    console.error("Admin payments fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}