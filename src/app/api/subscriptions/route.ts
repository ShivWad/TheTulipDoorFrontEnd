/**
 * User Subscriptions API
 * 
 * Endpoints for managing user flower subscriptions.
 * Uses Razorpay for payment processing.
 * 
 * Endpoints:
 * - GET /api/subscriptions - Get user's current subscription
 * - POST /api/subscriptions - Create new subscription
 * - PUT /api/subscriptions - Pause/Resume/Cancel subscription
 * 
 * Subscription Plans:
 * - solo: The Solo - ₹1800/month (12-15 stems)
 * - studio: The Studio - ₹3400/month (24-30 stems)
 * - gallery: The Gallery - ₹4800/month (40+ stems)
 * 
 * Environment Variables:
 * - RAZORPAY_KEY_ID: Razorpay API key
 * - RAZORPAY_KEY_SECRET: Razorpay API secret
 * 
 * Responses:
 * - 200: Success (GET/PUT)
 * - 201: Created (POST)
 * - 400: Validation error / already has subscription
 * - 401: Unauthorized
 * - 404: Subscription not found
 * - 500: Internal server error
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Razorpay from "razorpay";
import { z } from "zod";
import logger from "@/lib/logger";

/**
 * Zod schema for subscription creation
 * Validates plan selection and optional phone
 */
const subscriptionSchema = z.object({
  plan: z.enum(["solo", "studio", "gallery"]),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number").optional(),
});

/**
 * Zod schema for subscription actions
 */
const subscriptionActionSchema = z.object({
  action: z.enum(["pause", "resume", "cancel"]),
});

/**
 * Razorpay client instance
 * Initialized with environment credentials
 */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

/**
 * Subscription plan configurations
 * Defines pricing and features for each plan tier
 */
const PLANS = {
  solo: { price: 1800, name: "The Solo", stems: "12-15 Stems", period: "monthly" },
  studio: { price: 3400, name: "The Studio", stems: "24-30 Stems", period: "monthly" },
  gallery: { price: 4800, name: "The Gallery", stems: "40+ Stems", period: "monthly" },
};

/**
 * In-memory cache for Razorpay plan IDs
 * Plans are static and should only be created once
 */
const planCache: Map<string, string> = new Map();

/**
 * Create a Razorpay plan or return cached plan ID
 * 
 * Razorpay requires plans to be created before associating with subscriptions.
 * This function checks the cache first, then Razorpay API if not cached.
 * 
 * @param planKey - Plan key (solo/studio/gallery)
 * @returns Razorpay plan ID
 */
async function createOrGetPlan(planKey: string) {
  // Check cache first
  const cachedPlanId = planCache.get(planKey);
  if (cachedPlanId) {
    return cachedPlanId;
  }

  const planInfo = PLANS[planKey as keyof typeof PLANS];
  const planId = `plan_${planKey}_monthly`;

  try {
    // Try to fetch existing plan
    const existingPlan = await razorpay.plans.fetch(planId);
    planCache.set(planKey, existingPlan.id);
    return existingPlan.id;
  } catch {
    // Plan doesn't exist, create it
    const newPlan = await razorpay.plans.create({
      period: "monthly",
      interval: 1,
      item: {
        name: `${planInfo.name} - Monthly Subscription`,
        amount: planInfo.price,
        currency: "INR",
        description: `${planInfo.stems} - Delivered weekly`,
      },
    });
    planCache.set(planKey, newPlan.id);
    return newPlan.id;
  }
}

/**
 * GET /api/subscriptions
 * 
 * Get the current user's subscription details.
 * Returns subscription info or { hasSubscription: false } if none exists.
 */
export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch subscription with recent orders
    const subscription = await db.subscription.findUnique({
      where: { userId: session.user.id },
      include: {
        orders: {
          where: { orderType: "subscription" },
          orderBy: { createdAt: "desc" },
          take: 4,
        },
      },
    });

    // No subscription found
    if (!subscription) {
      return NextResponse.json({ hasSubscription: false });
    }

    // Return subscription details
    return NextResponse.json({
      hasSubscription: true,
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        planName: PLANS[subscription.plan as keyof typeof PLANS]?.name,
        price: subscription.price,
        status: subscription.status,
        nextBillingDate: subscription.nextBillingDate,
        nextDeliveryDate: subscription.nextDeliveryDate,
        createdAt: subscription.createdAt,
      },
    });
  } catch (error) {
    logger.error({ message: 'Get subscription error', error: (error as Error).message });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/subscriptions
 * 
 * Create a new flower subscription for the user.
 * Flow:
 * 1. Validate plan selection
 * 2. Check for existing active subscription
 * 3. Create Razorpay customer
 * 4. Create/get Razorpay plan
 * 5. Create Razorpay subscription
 * 6. Save subscription to database
 * 
 * Returns subscription checkout URL (short_url)
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    
    const validation = subscriptionSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { plan } = validation.data;

    // Check for existing active subscription
    const existingSub = await db.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (existingSub && existingSub.status !== "cancelled") {
      return NextResponse.json(
        { error: "You already have an active subscription" },
        { status: 400 }
      );
    }

    const planInfo = PLANS[plan as keyof typeof PLANS];
    
    // Fetch user data for customer creation
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    // Create Razorpay customer
    const customer = await razorpay.customers.create({
      name: user?.name || "Customer",
      email: user?.email,
      contact: user?.phone || undefined,
    });

    // Create or get Razorpay plan
    const razorpayPlanId = await createOrGetPlan(plan);

    // Create Razorpay subscription
    // Note: Using `as any` due to Razorpay SDK type issues
    const subscription: any = await razorpay.subscriptions.create({
      plan_id: razorpayPlanId,
      total_count: 52, // 1 year of deliveries
      quantity: 1,
      customer_id: customer.id,
      start_at: Math.floor(Date.now() / 1000) + 86400, // Start tomorrow
      notify_by: 1, // Notify customer
    } as any);

    // Calculate billing and delivery dates
    const now = new Date();
    const nextBillingDate = new Date(now);
    nextBillingDate.setDate(now.getDate() + 30);
    
    const nextDeliveryDate = new Date(now);
    const daysUntilSaturday = (6 - nextDeliveryDate.getDay() + 7) % 7 || 7;
    nextDeliveryDate.setDate(now.getDate() + daysUntilSaturday);

    // Save subscription to database
    let dbSubscription;
    if (existingSub) {
      // Update existing cancelled subscription
      dbSubscription = await db.subscription.update({
        where: { userId: session.user.id },
        data: {
          plan,
          price: planInfo.price,
          status: "active",
          razorpaySubId: subscription.id,
          razorpayCustomerId: customer.id,
          nextBillingDate,
          nextDeliveryDate,
        },
      });
    } else {
      // Create new subscription
      dbSubscription = await db.subscription.create({
        data: {
          userId: session.user.id,
          plan,
          price: planInfo.price,
          status: "active",
          razorpaySubId: subscription.id,
          razorpayCustomerId: customer.id,
          nextBillingDate,
          nextDeliveryDate,
        },
      });
    }

    // Return subscription details and checkout URL
    return NextResponse.json({
      subscriptionId: subscription.id,
      shortUrl: subscription.short_url,
      dbSubscription: {
        id: dbSubscription.id,
        plan: dbSubscription.plan,
        price: dbSubscription.price,
        status: dbSubscription.status,
        nextBillingDate: dbSubscription.nextBillingDate,
        nextDeliveryDate: dbSubscription.nextDeliveryDate,
      },
    });
  } catch (error) {
    logger.error({ message: 'Create subscription error', error: (error as Error).message });
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}

/**
 * PUT /api/subscriptions
 * 
 * Perform actions on an existing subscription.
 * 
 * Actions:
 * - pause: Pause subscription (stops billing, continues on resume)
 * - resume: Resume paused subscription
 * - cancel: Cancel subscription (terminates)
 * 
 * Updates both Razorpay and local database.
 */
export async function PUT(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's subscription
    const subscription = await db.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription) {
      return NextResponse.json({ error: "No subscription found" }, { status: 404 });
    }

    // Parse and validate action
    const body = await request.json();
    
    const validation = subscriptionActionSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { action } = validation.data;

    // Validate state transitions
    if (action === "pause" && subscription.status !== "active") {
      return NextResponse.json({ error: "Can only pause active subscriptions" }, { status: 400 });
    }

    if (action === "resume" && subscription.status !== "paused") {
      return NextResponse.json({ error: "Can only resume paused subscriptions" }, { status: 400 });
    }

    if (action === "cancel" && subscription.status === "cancelled") {
      return NextResponse.json({ error: "Subscription is already cancelled" }, { status: 400 });
    }

    // Handle pause action
    if (action === "pause") {
      await razorpay.subscriptions.pause(subscription.razorpaySubId!, {
        pause_at: "now",
      });
      
      await db.subscription.update({
        where: { userId: session.user.id },
        data: { status: "paused" },
      });

      return NextResponse.json({ message: "Subscription paused" });
    }

    // Handle resume action
    if (action === "resume") {
      await razorpay.subscriptions.resume(subscription.razorpaySubId!, {
        resume_at: "now",
      });
      
      await db.subscription.update({
        where: { userId: session.user.id },
        data: { status: "active" },
      });

      return NextResponse.json({ message: "Subscription resumed" });
    }

    // Handle cancel action
    if (action === "cancel") {
      await razorpay.subscriptions.cancel(subscription.razorpaySubId!);
      
      await db.subscription.update({
        where: { userId: session.user.id },
        data: { status: "cancelled" },
      });

      return NextResponse.json({ message: "Subscription cancelled" });
    }

    // Invalid action
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    logger.error({ message: 'Update subscription error', error: (error as Error).message });
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }
}
