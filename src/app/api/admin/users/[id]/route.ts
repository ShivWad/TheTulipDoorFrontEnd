import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { logUserAction, logSecurity } from "@/lib/logger";

const userUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number").optional().or(z.literal('')),
  isAdmin: z.boolean().optional(),
});

const userCreateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number").optional().or(z.literal('')),
  password: z.string().min(6, "Password must be at least 6 characters"),
  isAdmin: z.boolean().optional().default(false),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Middleware already validates isAdmin for /admin/* routes
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = getClientIp(request);
    const { success } = rateLimit(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { id } = await params;

    const userData = await db.user.findUnique({
      where: { id },
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
            nextBillingDate: true,
            nextDeliveryDate: true,
          },
        },
        addresses: {
          take: 5,
          select: {
            id: true,
            type: true,
            fullName: true,
            address: true,
            city: true,
            state: true,
            pincode: true,
            phone: true,
            isDefault: true,
          },
          orderBy: { isDefault: "desc" },
        },
        orders: {
          take: 5,
          select: {
            id: true,
            orderType: true,
            status: true,
            total: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        payments: {
          take: 5,
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error("Admin fetch user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Middleware already validates isAdmin for /admin/* routes
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = getClientIp(request);
    const { success } = rateLimit(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { id } = await params;
    const body = await request.json();
    const updateData = body;

    // Validate the update data
    const validation = userUpdateSchema.safeParse(updateData);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const validatedData = validation.data;

    // Prevent admin from demoting themselves
    if (validatedData.isAdmin === false && id === session.user.id) {
      logSecurity("self_demotion_attempt", { adminUserId: session.user.id, targetUserId: id });
      return NextResponse.json({ error: "Cannot demote yourself" }, { status: 400 });
    }

    // Check if email is being updated and if it's already taken
    if (validatedData.email) {
      const existingUser = await db.user.findFirst({
        where: {
          email: validatedData.email,
          NOT: { id },
        },
      });

      if (existingUser) {
        return NextResponse.json({ error: "Email is already in use" }, { status: 400 });
      }
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: validatedData,
    });

    logUserAction(session.user.id, "admin_update_user", {
      targetUserId: id,
      updatedFields: Object.keys(validatedData),
    });

    return NextResponse.json({ 
      message: "User updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.error("Admin update user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Middleware already validates isAdmin for /admin/* routes
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = getClientIp(request);
    const { success } = rateLimit(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    
    // Validate the input
    const validation = userCreateSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { name, email, phone, password, isAdmin } = validation.data;

    // Check if email is already taken
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email is already in use" }, { status: 400 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create the user
    const newUser = await db.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        isAdmin: isAdmin || false,
      },
    });

    logUserAction(session.user.id, "admin_create_user", {
      newUserId: newUser.id,
      isAdmin: newUser.isAdmin,
    });

    return NextResponse.json({ 
      message: "User created successfully",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        isAdmin: newUser.isAdmin,
        createdAt: newUser.createdAt,
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Admin create user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Middleware already validates isAdmin for /admin/* routes
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = getClientIp(request);
    const { success } = rateLimit(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Prevent admin from deleting themselves
    if (id === session.user.id) {
      logSecurity("self_deletion_attempt", { adminUserId: session.user.id });
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
    }

    const userToDelete = await db.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true },
    });

    if (!userToDelete) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await db.user.delete({
      where: { id },
    });

    logUserAction(session.user.id, "admin_delete_user", {
      deletedUserId: id,
      deletedUserEmail: userToDelete.email,
      deletedUserName: userToDelete.name,
    });

    return NextResponse.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Admin delete user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}