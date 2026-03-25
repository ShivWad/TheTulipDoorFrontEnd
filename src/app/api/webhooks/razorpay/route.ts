import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";
import logger from "@/lib/logger";

interface RazorpayWebhookPayload {
  event: string;
  payload: {
    subscription?: {
      entity: {
        id: string;
        status: string;
        customer_id: string;
        plan_id: string;
        current_start?: number;
        charge_at?: number;
      };
    };
    payment?: {
      entity: {
        id: string;
        order_id: string;
        amount: number;
        status: string;
      };
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const payload: RazorpayWebhookPayload = JSON.parse(body);
    const event = payload.event;

    console.log("Razorpay webhook received:", event);

    switch (event) {
      case "subscription.charged": {
        const subscriptionEntity = payload.payload.subscription?.entity;
        if (!subscriptionEntity) break;

        const subscription = await db.subscription.findFirst({
          where: { razorpaySubId: subscriptionEntity.id },
        });

        if (subscription) {
          const now = new Date();
          const nextBillingDate = new Date(now);
          nextBillingDate.setMonth(now.getMonth() + 1);

          const nextDeliveryDate = new Date(now);
          const daysUntilSaturday = (6 - nextDeliveryDate.getDay() + 7) % 7 || 7;
          nextDeliveryDate.setDate(now.getDate() + daysUntilSaturday);

          await db.subscription.update({
            where: { id: subscription.id },
            data: {
              nextBillingDate,
              nextDeliveryDate,
              status: "active",
            },
          });

          logger.info(`Subscription ${subscription.id} charged. Next billing: ${nextBillingDate}`);
        }
        break;
      }

      case "subscription.paused": {
        const subscriptionEntity = payload.payload.subscription?.entity;
        if (!subscriptionEntity) break;

        await db.subscription.updateMany({
          where: { razorpaySubId: subscriptionEntity.id },
          data: { status: "paused" },
        });
        break;
      }

      case "subscription.resumed": {
        const subscriptionEntity = payload.payload.subscription?.entity;
        if (!subscriptionEntity) break;

        await db.subscription.updateMany({
          where: { razorpaySubId: subscriptionEntity.id },
          data: { status: "active" },
        });
        break;
      }

      case "subscription.cancelled": {
        const subscriptionEntity = payload.payload.subscription?.entity;
        if (!subscriptionEntity) break;

        await db.subscription.updateMany({
          where: { razorpaySubId: subscriptionEntity.id },
          data: { status: "cancelled" },
        });
        break;
      }

      case "subscription.authenticated": {
        const subscriptionEntity = payload.payload.subscription?.entity;
        if (!subscriptionEntity) break;

        const subscription = await db.subscription.findFirst({
          where: { razorpaySubId: subscriptionEntity.id },
        });

        if (subscription) {
          const now = new Date();
          const nextBillingDate = new Date(now);
          nextBillingDate.setMonth(now.getMonth() + 1);

          const nextDeliveryDate = new Date(now);
          const daysUntilSaturday = (6 - nextDeliveryDate.getDay() + 7) % 7 || 7;
          nextDeliveryDate.setDate(now.getDate() + daysUntilSaturday);

          await db.subscription.update({
            where: { id: subscription.id },
            data: {
              status: "active",
              nextBillingDate,
              nextDeliveryDate,
            },
          });
        }
        break;
      }

      case "subscription.failed": {
        const subscriptionEntity = payload.payload.subscription?.entity;
        if (!subscriptionEntity) break;

        logger.info(`Subscription ${subscriptionEntity.id} payment failed`);
        break;
      }

      default:
        console.log("Unhandled webhook event:", event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error({ message: 'Webhook error', error: (error as Error).message });
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
