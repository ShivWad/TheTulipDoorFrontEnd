/**
 * Admin Subscriptions API
 * 
 * Admin-only endpoints for viewing and managing subscriptions.
 * 
 * Endpoints:
 * - GET /api/admin/subscriptions - List all subscriptions
 * - PUT /api/admin/subscriptions - Pause/Resume/Cancel subscription
 * 
 * GET Query Parameters:
 * - filter: Filter by status (all | active | paused | cancelled)
 * - page: Page number (default: 1)
 * 
 * PUT Request Body:
 * - id: Subscription ID (required)
 * - action: Action to perform (pause | resume | cancel)
 * 
 * Security:
 * - Requires admin authentication (isAdmin: true)
 * - Rate limited: 5 requests per 15 minutes
 * - Audit logging for all state changes
 * 
 * Responses:
 * - 200: Success (GET/PUT)
 * - 401: Unauthorized
 * - 403: Forbidden (not admin)
 * - 404: Subscription not found
 * - 429: Rate limit exceeded
 * - 500: Internal server error
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { logUserAction } from "@/lib/logger";

/**
 * GET /api/admin/subscriptions
 * 
 * Fetch paginated list of all subscriptions with optional status filtering.
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

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;
    const skip = (page - 1) * limit;

    // 4. Build status filter
    const where = filter !== "all" ? { status: filter } : {};

    // 5. Fetch subscriptions and total count
    const [subscriptions, total] = await Promise.all([
      db.subscription.findMany({
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
        },
      }),
      db.subscription.count({ where }),
    ]);

    // 7. Return paginated response
    return NextResponse.json({
      subscriptions,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    console.error("Admin subscriptions fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/subscriptions
 * 
 * Perform administrative actions on a subscription.
 * Actions: pause, resume, cancel
 * 
 * All actions are logged for audit purposes.
 */
export async function PUT(request: NextRequest) {
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

    // 3. Parse request body
    const { id, action } = await request.json();

    // 4. Find subscription
    const subscription = await db.subscription.findUnique({
      where: { id },
    });

    if (!subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // 5. Determine new status based on action
    let newStatus = subscription.status;
    
    if (action === "pause") {
      newStatus = "paused";
    } else if (action === "resume") {
      newStatus = "active";
    } else if (action === "cancel") {
      newStatus = "cancelled";
    }

    // 6. Update subscription status
    await db.subscription.update({
      where: { id },
      data: { status: newStatus },
    });

    // 7. Log admin action for audit
    logUserAction(session.user.id, `admin_${action}_subscription`, {
      subscriptionId: id,
      previousStatus: subscription.status,
      newStatus,
    });

    // 8. Return success response
    return NextResponse.json({ message: `Subscription ${action}ed successfully` });
  } catch (error) {
    console.error("Admin subscription update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}