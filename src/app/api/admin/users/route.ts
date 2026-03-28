/**
 * Admin Users API
 * 
 * Admin-only endpoint for listing all users with pagination and search.
 * 
 * GET /api/admin/users - List users with pagination
 * POST /api/admin/users - Create new user
 * 
 * Query Parameters (GET):
 * - page: Page number (default: 1)
 * - search: Search term for name or email (optional)
 * 
 * Request Body (POST):
 * - name: User's name (required)
 * - email: User's email (required)
 * - phone: Phone number (optional)
 * - password: Password (required)
 * - isAdmin: Admin flag (optional, default: false)
 * 
 * Security:
 * - Requires admin authentication (isAdmin: true)
 * - Rate limited: 5 requests per 15 minutes
 * - Secondary authorization check on session
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
import { z } from "zod";
import bcrypt from "bcryptjs";
import { logUserAction } from "@/lib/logger";

const userCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number").optional().or(z.literal('')),
  password: z.string().min(6, "Password must be at least 6 characters"),
  isAdmin: z.boolean().optional().default(false),
});

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

/**
 * POST /api/admin/users
 * 
 * Create a new user.
 * Requires admin privileges.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Check authentication and authorization
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

    // 3. Parse and validate request body
    const body = await request.json();
    const validation = userCreateSchema.safeParse(body);
    
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, email, phone, password, isAdmin } = validation.data;

    // 4. Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // 5. Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await db.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: hashedPassword,
        isAdmin,
      },
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    // 6. Log admin action
    logUserAction(session.user.id, "admin_create_user", {
      newUserId: newUser.id,
      email: newUser.email,
      isAdmin: newUser.isAdmin,
    });

    return NextResponse.json({
      message: "User created successfully",
      user: newUser,
    }, { status: 201 });
  } catch (error) {
    console.error("Admin user create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}