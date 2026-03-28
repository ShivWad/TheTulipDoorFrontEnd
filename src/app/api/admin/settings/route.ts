import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { logUserAction } from "@/lib/logger";
import { z } from "zod";

const settingsSchema = z.record(z.string(), z.string());

export async function GET(request: NextRequest) {
  try {
    // Middleware already validates isAdmin for /admin/* routes
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

    const settings = await db.systemSettings.findMany({
      orderBy: { key: 'asc' },
    });

    // Convert to an object for easier use in the frontend
    const settingsObject: Record<string, string> = {};
    settings.forEach(setting => {
      settingsObject[setting.key] = setting.value;
    });

    return NextResponse.json({ settings: settingsObject, settingsList: settings });
  } catch (error) {
    console.error("Admin settings fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Middleware already validates isAdmin for /admin/* routes
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

    // Rate limiting
    const ip = getClientIp(request);
    const { success } = rateLimit(ip);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();

    // Validate input
    const validation = settingsSchema.safeParse(body.settings);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { settings } = body;

    // Get previous settings for audit logging
    const previousSettings = await db.systemSettings.findMany();
    const previousMap = Object.fromEntries(previousSettings.map(s => [s.key, s.value]));

    // Update all settings in parallel using transaction
    await db.$transaction(
      Object.entries(settings).map(([key, value]) =>
        db.systemSettings.upsert({
          where: { key },
          update: { value: value as string },
          create: { key, value: value as string },
        })
      )
    );

    // Audit log the changes
    const changedKeys = Object.keys(settings).filter(key => settings[key] !== previousMap[key]);
    if (changedKeys.length > 0) {
      logUserAction(session.user.id, "admin_update_settings", {
        changedKeys,
        previousValues: Object.fromEntries(
          changedKeys.map(key => [key, previousMap[key]])
        ),
        newValues: Object.fromEntries(
          changedKeys.map(key => [key, settings[key]])
        ),
      });
    }

    return NextResponse.json({ message: "Settings updated successfully" });
  } catch (error) {
    console.error("Admin settings update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}