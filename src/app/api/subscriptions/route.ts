import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Razorpay from "razorpay";
import { z } from "zod";
import logger from "@/lib/logger";

const subscriptionSchema = z.object({
  plan: z.enum(["solo", "studio", "gallery"]),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number").optional(),
});

const subscriptionActionSchema = z.object({
  action: z.enum(["pause", "resume", "cancel"]),
});

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const PLANS = {
  solo: { price: 1800, name: "The Solo", stems: "12-15 Stems", period: "monthly" },
  studio: { price: 3400, name: "The Studio", stems: "24-30 Stems", period: "monthly" },
  gallery: { price: 4800, name: "The Gallery", stems: "40+ Stems", period: "monthly" },
};

async function createOrGetPlan(planKey: string) {
  const planInfo = PLANS[planKey as keyof typeof PLANS];
  const planId = `plan_${planKey}_monthly`;

  try {
    const existingPlan = await razorpay.plans.fetch(planId);
    return existingPlan.id;
  } catch {
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
    return newPlan.id;
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    if (!subscription) {
      return NextResponse.json({ hasSubscription: false });
    }

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

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    
    const validation = subscriptionSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { plan } = validation.data;

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
    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    const customer = await razorpay.customers.create({
      name: user?.name || "Customer",
      email: user?.email,
      contact: user?.phone || undefined,
    });

    const razorpayPlanId = await createOrGetPlan(plan);

    const subscription: any = await razorpay.subscriptions.create({
      plan_id: razorpayPlanId,
      total_count: 52,
      quantity: 1,
      customer_id: customer.id,
      start_at: Math.floor(Date.now() / 1000) + 86400,
      notify_by: 1,
    } as any);

    const now = new Date();
    const nextBillingDate = new Date(now);
    nextBillingDate.setDate(now.getDate() + 30);
    
    const nextDeliveryDate = new Date(now);
    const daysUntilSaturday = (6 - nextDeliveryDate.getDay() + 7) % 7 || 7;
    nextDeliveryDate.setDate(now.getDate() + daysUntilSaturday);

    let dbSubscription;
    if (existingSub) {
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

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await db.subscription.findUnique({
      where: { userId: session.user.id },
    });

    if (!subscription) {
      return NextResponse.json({ error: "No subscription found" }, { status: 404 });
    }

    const body = await request.json();
    
    const validation = subscriptionActionSchema.safeParse(body);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { action } = validation.data;

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

    if (action === "cancel") {
      await razorpay.subscriptions.cancel(subscription.razorpaySubId!);
      
      await db.subscription.update({
        where: { userId: session.user.id },
        data: { status: "cancelled" },
      });

      return NextResponse.json({ message: "Subscription cancelled" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    logger.error({ message: 'Update subscription error', error: (error as Error).message });
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }
}
