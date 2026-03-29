/**
 * One-Time Purchases API
 * 
 * Endpoints for one-time flower purchases (not subscriptions).
 * Uses Razorpay Payment Links for checkout.
 * 
 * Endpoints:
 * - GET /api/purchases - Get user's current/previous purchase
 * - POST /api/purchases - Create new one-time purchase
 * 
 * Environment Variables:
 * - RAZORPAY_KEY_ID: Razorpay API key
 * - RAZORPAY_KEY_SECRET: Razorpay API secret
 * - NEXT_PUBLIC_APP_URL: App URL for callback
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateNextDeliveryDate } from "@/lib/delivery";
import Razorpay from "razorpay";
import { z } from "zod";
import logger from "@/lib/logger";

const purchaseSchema = z.object({
  plan: z.enum(["one_time"]),
});

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

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
      message: `Please add your ${missingFields.join(", ")} before purchasing.`,
      status: 400
    };
  }

  return { valid: true, user, address };
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const purchase = await db.oneTimePurchase.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    if (!purchase) {
      return NextResponse.json({ hasPurchase: false });
    }

    const planDetails = await db.subscriptionPlan.findUnique({
      where: { planKey: purchase.planKey },
    });

    return NextResponse.json({
      hasPurchase: true,
      purchase: {
        id: purchase.id,
        plan: purchase.planKey,
        planName: planDetails?.name || purchase.planKey,
        price: purchase.price,
        status: purchase.status,
        nextDeliveryDate: purchase.nextDeliveryDate,
        createdAt: purchase.createdAt,
      },
    });
  } catch (error) {
      console.log(">>>GET",error);

    logger.error({ message: 'Get purchase error', error: (error as Error).message });
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
    const validation = purchaseSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }

    const userCheck = await validateUserRequirements(session.user.id);
    if (!userCheck.valid || !userCheck.user) {
      return NextResponse.json({
        error: userCheck.error,
        details: userCheck.details,
        message: userCheck.message,
      }, { status: userCheck.status });
    }
    const user = userCheck.user as any;

    const planInfo = await db.subscriptionPlan.findUnique({ where: { planKey: "one_time" } });
    if (!planInfo) {
      return NextResponse.json({ error: "One-time purchase not available" }, { status: 400 });
    }

    // Get or create Razorpay customer
    let razorpayCustomerId = user.razorpayCustomerId;
    if (!razorpayCustomerId) {
      try {
        const customer = await razorpay.customers.create({
          name: user.name || "Customer",
          email: user.email,
          contact: user.phone || undefined,
        });
        razorpayCustomerId = customer.id;
      } catch (error: any) {
      console.log(">>>CUSTOMER CREATE",error);

        const razorpayError = error.response?.body?.error;
        console.error('Razorpay customer create error:', razorpayError || error.message);
        
        if (razorpayError?.code === 'BAD_REQUEST_ERROR' && razorpayError?.description?.includes('already exists')) {
          const customers = await razorpay.customers.all({
            count: 1,
            //@ts-ignore
            email: user.email,
          }) as any;
          
          if (customers.items.length > 0) {
            razorpayCustomerId = customers.items[0].id;
          } else {
            console.error('Could not find existing customer in Razorpay');
            return NextResponse.json({
              error: "Payment setup failed",
              message: "Unable to find existing payment account. Please contact support.",
            }, { status: 400 });
          }
        } else {
          return NextResponse.json({
            error: razorpayError?.description || "Failed to create payment account",
            message: razorpayError?.reason || "Please try again later.",
          }, { status: 400 });
        }
      }
      
      await db.user.update({
        where: { id: session.user.id },
        data: { razorpayCustomerId } as any,
      });
    }

    const paymentLink = await razorpay.paymentLink.create({
      amount: planInfo.price,
      currency: "INR",
      accept_partial: false,
      description: `${planInfo.name} - One-time purchase`,
      customer: { email: user.email, contact: user.phone || undefined },
      notes: { planKey: "one_time", type: "one_time", userId: session.user.id },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/account/rituals?payment=success`,
      callback_method: "get",
    } as any);

    const purchase = await db.oneTimePurchase.create({
      data: {
        userId: session.user.id,
        planKey: "one_time",
        price: planInfo.price,
        status: "pending",
        razorpayPaymentLinkId: paymentLink.id,
        nextDeliveryDate: calculateNextDeliveryDate(),
      },
    });

    return NextResponse.json({
      purchaseId: purchase.id,
      shortUrl: paymentLink.short_url,
      purchase: {
        id: purchase.id,
        plan: purchase.planKey,
        price: purchase.price,
        status: purchase.status,
        nextDeliveryDate: purchase.nextDeliveryDate,
      },
    });
  } catch (error: any) {
      console.log(">>>PURCHASE POST ",error);
    
    const razorpayError = error.response?.body?.error;
    if (razorpayError) {
      console.error('Razorpay purchase error:', razorpayError);
      logger.error({ message: 'Create purchase error', error: razorpayError });
      return NextResponse.json({
        error: razorpayError.description || "Payment failed",
        message: razorpayError.reason || "Failed to create purchase",
      }, { status: 400 });
    }
    console.error('Purchase error:', error.message);
    logger.error({ message: 'Create purchase error', error: error.message });
    return NextResponse.json({ error: "Failed to create purchase" }, { status: 500 });
  }
}
