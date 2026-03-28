/**
 * Razorpay Webhook Handler
 * 
 * POST /api/webhooks/razorpay
 * 
 * Receives and processes webhook events from Razorpay payment gateway.
 * This keeps the local database in sync with Razorpay's subscription state.
 * 
 * Security:
 * - Verifies webhook signature using HMAC-SHA256
 * - Requires RAZORPAY_WEBHOOK_SECRET environment variable
 * - Implements idempotency to prevent duplicate event processing
 * 
 * Supported Events:
 * - subscription.charged: Payment successful - update billing dates
 * - subscription.paused: Subscription paused - update status
 * - subscription.resumed: Subscription resumed - update status
 * - subscription.cancelled: Subscription cancelled - update status
 * - subscription.authenticated: Subscription activated - set active status
 * - subscription.failed: Payment failed - log for monitoring
 * 
 * Environment Variables:
 * - RAZORPAY_WEBHOOK_SECRET: Secret for signature verification
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";
import logger from "@/lib/logger";

/**
 * TypeScript interface for Razorpay webhook payload structure
 * Defines the shape of expected webhook event data
 */
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

/**
 * Handle incoming Razorpay webhook
 * 
 * Flow:
 * 1. Verify webhook signature (security)
 * 2. Parse event type
 * 3. Update local database based on event
 * 4. Return acknowledgment
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Get raw body and signature from headers
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    // Check for missing signature
    if (!signature) {
      return NextResponse.json({ error: "No signature" }, { status: 400 });
    }

    // 2. Verify webhook signature
    // Razorpay signs requests with HMAC-SHA256 using webhook secret
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest("hex");

    // Signature mismatch = potential spoofed request
    if (signature !== expectedSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // 3. Parse and process the payload
    const payload: RazorpayWebhookPayload = JSON.parse(body);
    const event = payload.event;
    const razorpayEventId = payload.payload?.subscription?.entity?.id || 
                           payload.payload?.payment?.entity?.id ||
                           `${event}-${Date.now()}`;

    // 4. Idempotency check - prevent duplicate processing
    const existingEvent = await db.webhookEvent.findUnique({
      where: { eventId: razorpayEventId },
    });

    if (existingEvent?.processed) {
      logger.info({ eventId: razorpayEventId, message: 'Webhook already processed, skipping' });
      return NextResponse.json({ received: true, skipped: true });
    }

    // Log received event for monitoring
    logger.info({ event, message: 'Razorpay webhook received' });

    // 4. Handle different webhook events
    switch (event) {
      // subscription.charged: Successful payment
      // Update next billing and delivery dates
      case "subscription.charged": {
        const subscriptionEntity = payload.payload.subscription?.entity;
        if (!subscriptionEntity) break;

        // Find subscription in our database
        const subscription = await db.subscription.findFirst({
          where: { razorpaySubId: subscriptionEntity.id },
        });

        if (subscription) {
          // Calculate next billing date (30 days from now)
          const now = new Date();
          const nextBillingDate = new Date(now);
          nextBillingDate.setMonth(now.getMonth() + 1);

          // Calculate next delivery date (next Saturday)
          const nextDeliveryDate = new Date(now);
          const daysUntilSaturday = (6 - nextDeliveryDate.getDay() + 7) % 7 || 7;
          nextDeliveryDate.setDate(now.getDate() + daysUntilSaturday);

          // Update subscription with new dates
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

      // payment.captured: One-time payment successful
      case "payment.captured": {
        const paymentEntity = payload.payload.payment?.entity;
        if (!paymentEntity) break;

        // Find subscription by order ID
        const subscription = await db.subscription.findFirst({
          where: { razorpayOrderId: paymentEntity.order_id },
        });

        if (subscription && subscription.type === "one_time") {
          // Calculate next delivery date (next Saturday)
          const now = new Date();
          const nextDeliveryDate = new Date(now);
          const daysUntilSaturday = (6 - nextDeliveryDate.getDay() + 7) % 7 || 7;
          nextDeliveryDate.setDate(now.getDate() + daysUntilSaturday);

          // Update one-time order to completed
          await db.subscription.update({
            where: { id: subscription.id },
            data: {
              status: "completed",
              nextDeliveryDate,
            },
          });

          logger.info(`One-time payment ${paymentEntity.id} captured for subscription ${subscription.id}`);
        }
        break;
      }

      // subscription.paused: Subscription was paused
      case "subscription.paused": {
        const subscriptionEntity = payload.payload.subscription?.entity;
        if (!subscriptionEntity) break;

        await db.subscription.updateMany({
          where: { razorpaySubId: subscriptionEntity.id },
          data: { status: "paused" },
        });
        break;
      }

      // subscription.resumed: Subscription was resumed
      case "subscription.resumed": {
        const subscriptionEntity = payload.payload.subscription?.entity;
        if (!subscriptionEntity) break;

        await db.subscription.updateMany({
          where: { razorpaySubId: subscriptionEntity.id },
          data: { status: "active" },
        });
        break;
      }

      // subscription.cancelled: Subscription was cancelled
      case "subscription.cancelled": {
        const subscriptionEntity = payload.payload.subscription?.entity;
        if (!subscriptionEntity) break;

        await db.subscription.updateMany({
          where: { razorpaySubId: subscriptionEntity.id },
          data: { status: "cancelled" },
        });
        break;
      }

      // subscription.authenticated: Subscription was activated/confirmed
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

      // subscription.failed: Payment attempt failed
      case "subscription.failed": {
        const subscriptionEntity = payload.payload.subscription?.entity;
        if (!subscriptionEntity) break;

        logger.info({ subscriptionId: subscriptionEntity.id, message: 'Subscription payment failed' });
        break;
      }

      // Handle unknown events gracefully
      default:
        logger.info({ event, message: 'Unhandled webhook event' });
    }

    // Record event for idempotency
    await db.webhookEvent.upsert({
      where: { eventId: razorpayEventId },
      create: {
        eventId: razorpayEventId,
        event,
        processed: true,
      },
      update: {
        processed: true,
      },
    });

    // Return 200 to acknowledge webhook receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    // Log error for debugging
    logger.error({ message: 'Webhook error', error: (error as Error).message });
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
