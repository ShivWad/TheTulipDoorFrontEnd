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
 * Get Razorpay plan/price ID from database
 * 
 * Plans are managed manually in Razorpay dashboard.
 * This function reads the plan/price ID from the database.
 * 
 * @param planKey - Plan key (solo, studio, gallery, single)
 * @param type - "recurring" or "one_time"
 * @returns Razorpay plan/price ID
 */
async function getRazorpayPlanId(planKey: string) {
  const dbPlan = await db.subscriptionPlan.findUnique({
    where: { planKey },
  });

  if (!dbPlan) {
    throw new Error(`Plan not found: ${planKey}`);
  }

  if (!dbPlan.razorpayPlanId) {
    throw new Error(`Razorpay plan ID not configured for: ${planKey}`);
  }
  return dbPlan.razorpayPlanId;
}

// ============== HELPER FUNCTIONS ==============

/**
 * Validate user has required information (name, phone, address)
 */
async function validateUserRequirements(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { valid: false, error: "User not found", status: 404 };

  const missingFields: string[] = [];
  if (!user.name?.trim()) missingFields.push("name");
  if (!user.phone?.trim()) missingFields.push("phone");

  const address = await db.address.findFirst({ where: { userId, isDefault: true } });
  if (!address) missingFields.push("address");

  if (missingFields.length > 0) {
    return {
      valid: false,
      error: "Missing required information",
      details: missingFields,
      message: `Please add your ${missingFields.join(", ")} before subscribing.`,
      status: 400
    };
  }

  return { valid: true, user: user as any, address };
}

/**
 * Check if user already has an active subscription
 * Blocks if active/pending/paused
 */
async function checkExistingSubscription(userId: string) {
  const existing = await db.subscription.findUnique({ where: { userId } });
  
  if (existing && existing.status !== "cancelled" && existing.status !== "completed") {
    return { blocked: true, error: "You already have an active subscription", status: 400 };
  }
  return { blocked: false, existing };
}

/**
 * Calculate next delivery date (Saturday)
 */
function getNextDeliveryDate() {
  const date = new Date();
  const days = (6 - date.getDay() + 7) % 7 || 7;
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Create recurring subscription
 */
async function createRecurringSubscription(planId: string, customerId: string) {
  const subscription: any = await razorpay.subscriptions.create({
    plan_id: planId,
    total_count: 52,
    quantity: 1,
    customer_id: customerId,
    start_at: Math.floor(Date.now() / 1000) + 86400,
    notify_by: 1,
  } as any);

  return { 
    razorpaySubId: subscription.id, 
    shortUrl: subscription.short_url, 
    nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    nextDeliveryDate: getNextDeliveryDate(),
  };
}

/**
 * Save subscription to database
 */
async function saveSubscription(
  userId: string,
  plan: string,
  planInfo: { price: number },
  existingSub: { id: string } | null | undefined,
  razorpayData: {
    razorpaySubId: string | null;
    nextBillingDate: Date | null;
    nextDeliveryDate: Date;
  }
) {
  const data = {
    userId, plan, price: planInfo.price, status: "pending" as const,
    razorpaySubId: razorpayData.razorpaySubId,
    nextBillingDate: razorpayData.nextBillingDate,
    nextDeliveryDate: razorpayData.nextDeliveryDate,
  };

  if (existingSub?.id) {
    return db.subscription.update({ where: { id: existingSub.id }, data });
  }
  return db.subscription.create({ data });
}

// ============== POST ENDPOINT ==============

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
    // Fetch plan name from database
    const planDetails = await db.subscriptionPlan.findUnique({
      where: { planKey: subscription.plan },
    });

    return NextResponse.json({
      hasSubscription: true,
      subscription: {
        id: subscription.id,
        plan: subscription.plan,
        planName: planDetails?.name || subscription.plan,
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
 * Steps:
 * 1. Validate authentication
 * 2. Validate plan selection
 * 3. Check existing subscription
 * 4. Validate user requirements
 * 5. Create Razorpay customer
 * 6. Create payment (one-time) or subscription (recurring)
 * 7. Save to database
 * 
 * Returns checkout URL (short_url)
 */
export async function POST(request: NextRequest) {
  try {
    // Step 1: Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Step 2: Validate request
    const body = await request.json();
    const validation = subscriptionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }
    const { plan } = validation.data;

    // Step 3: Get plan details
    const planInfo = await db.subscriptionPlan.findUnique({ where: { planKey: plan } });
    if (!planInfo) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
    }

    const planType = planInfo.type || "recurring";

    // Step 4: Check existing subscription
    const existingCheck = await checkExistingSubscription(session.user.id);
    if (existingCheck.blocked) {
      return NextResponse.json({ error: existingCheck.error }, { status: existingCheck.status });
    }

    // Step 5: Validate user requirements
    const userCheck = await validateUserRequirements(session.user.id);
    if (!userCheck.valid || !userCheck.user) {
      return NextResponse.json({
        error: userCheck.error,
        details: userCheck.details,
        message: userCheck.message,
      }, { status: userCheck.status });
    }
    const user = userCheck.user;

    // Step 6: Get or create Razorpay customer
    let razorpayCustomerId = (user as any).razorpayCustomerId;
    if (!razorpayCustomerId) {
      try {
        const customer = await razorpay.customers.create({
          name: user.name || "Customer",
          email: user.email,
          contact: user.phone || undefined,
        });
        razorpayCustomerId = customer.id;
        await db.user.update({
          where: { id: session.user.id },
          data: { razorpayCustomerId } as any,
        });
      } catch (customerError: any) {
        const errorBody = customerError.response?.body?.error;
        if (customerError.response?.status === 400 && 
            errorBody?.code === 'BAD_REQUEST_ERROR' && 
            errorBody?.description?.includes('Customer already exists')) {
          const existingCustomer = await razorpay.customers.all({ email: user.email } as any);
          if (existingCustomer.items.length > 0) {
            razorpayCustomerId = existingCustomer.items[0].id;
            await db.user.update({
              where: { id: session.user.id },
              data: { razorpayCustomerId } as any,
            });
          } else {
            logger.error({ message: 'Customer creation failed', error: errorBody });
            return NextResponse.json({
              error: "Payment setup failed",
              message: "Unable to create payment account. Please contact support.",
            }, { status: 400 });
          }
        } else {
          logger.error({ message: 'Customer creation failed', error: errorBody || customerError.message });
          return NextResponse.json({
            error: errorBody?.description || "Payment setup failed",
            message: errorBody?.reason || "Failed to initialize payment",
          }, { status: 400 });
        }
      }
    }

    // Step 7: Create recurring subscription
    const planId = await getRazorpayPlanId(plan);
    const razorpayResult = await createRecurringSubscription(planId, razorpayCustomerId);

    // Step 8: Save to database
    const dbSubscription = await saveSubscription(
      session.user.id, plan, planInfo, existingCheck.existing,
      {
        razorpaySubId: razorpayResult.razorpaySubId,
        nextBillingDate: razorpayResult.nextBillingDate,
        nextDeliveryDate: razorpayResult.nextDeliveryDate,
      }
    );

    return NextResponse.json({
      orderId: razorpayResult.razorpaySubId,
      shortUrl: razorpayResult.shortUrl,
      dbSubscription: {
        id: dbSubscription.id,
        plan: dbSubscription.plan,
        price: dbSubscription.price,
        status: dbSubscription.status,
        nextBillingDate: dbSubscription.nextBillingDate,
        nextDeliveryDate: dbSubscription.nextDeliveryDate,
      },
    });
  } catch (error: any) {
    const razorpayError = error.response?.body?.error;
    if (razorpayError) {
      logger.error({ message: 'Create subscription error', error: razorpayError });
      return NextResponse.json({
        error: razorpayError.description || "Payment failed",
        message: razorpayError.reason || "Failed to create subscription",
      }, { status: 400 });
    }

    logger.error({ message: 'Create subscription error', error: error.message });
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
