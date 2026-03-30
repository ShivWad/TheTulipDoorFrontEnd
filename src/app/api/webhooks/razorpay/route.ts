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
 * - Uses Prisma transactions for atomicity
 * 
 * Supported Events:
 * - subscription.charged: Payment successful - update billing dates, create payment record
 * - subscription.paused: Subscription paused - update status
 * - subscription.resumed: Subscription resumed - update status
 * - subscription.cancelled: Subscription cancelled - update status
 * - subscription.authenticated: Subscription activated - set active status
 * - subscription.failed: Payment failed - log for monitoring
 * - payment.captured: One-time payment successful
 * - payment_link.paid: Payment Link (one-time) was paid
 * - payment.refunded: Payment was refunded
 * 
 * Environment Variables:
 * - RAZORPAY_WEBHOOK_SECRET: Secret for signature verification
 * - NEXT_PUBLIC_APP_URL: App URL for constructing URLs
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { calculateNextDeliveryDate, isDeliveryCutoffPassed } from "@/lib/delivery";
import crypto from "crypto";
import logger from "@/lib/logger";

function calculateNextBillingDate(currentEnd?: number, chargeAt?: number): Date {
  if (currentEnd) {
    return new Date(currentEnd * 1000);
  }
  if (chargeAt) {
    const date = new Date(chargeAt * 1000);
    date.setMonth(date.getMonth() + 1);
    return date;
  }
  const date = new Date();
  date.setMonth(date.getMonth() + 1);
  return date;
}

function validateWebhookPayload(payload: unknown): payload is {
  event: string;
  payload: {
    subscription?: {
      entity?: {
        id?: string;
        status?: string;
        customer_id?: string;
        plan_id?: string;
        current_start?: number;
        current_end?: number;
        charge_at?: number;
      };
    };
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        amount?: number;
        status?: string;
        refunded_at?: number;
      };
    };
    payment_link?: {
      entity?: {
        id?: string;
        amount?: number;
        status?: string;
        customer_id?: string;
      };
    };
    order?: {
      entity?: {
        id?: string;
        receipt?: string;
      };
    };
  };
} {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as Record<string, unknown>;
  if (!p.event || typeof p.event !== "string") return false;
  if (!p.payload || typeof p.payload !== "object") return false;
  return true;
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

    const payload = JSON.parse(body);
    
    if (!validateWebhookPayload(payload)) {
      logger.error({ message: 'Invalid webhook payload structure' });
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const razorpayEventId = request.headers.get("x-razorpay-event-id");
    if (!razorpayEventId) {
      return NextResponse.json({ error: "No event ID" }, { status: 400 });
    }

    const existingEvent = await db.webhookEvent.findUnique({
      where: { eventId: razorpayEventId },
    });

    if (existingEvent?.processed) {
      logger.info({ eventId: razorpayEventId, message: 'Webhook already processed, skipping' });
      return NextResponse.json({ received: true, skipped: true });
    }

    logger.info({ event: payload.event, message: 'Razorpay webhook received' });

    const event = payload.event;
    const subscriptionEntity = payload.payload.subscription?.entity;
    const paymentEntity = payload.payload.payment?.entity;
    const paymentLinkEntity = payload.payload.payment_link?.entity;

    if (existingEvent?.processed) {
      logger.info({ eventId: razorpayEventId, message: 'Webhook already processed, skipping' });
      return NextResponse.json({ received: true, skipped: true });
    }

    logger.info({ event, message: 'Razorpay webhook received' });

    let result: unknown;
    
    switch (event) {
      case "subscription.charged": {
        if (!subscriptionEntity?.id) break;
        
        const subId = subscriptionEntity.id;
        const currentEnd = subscriptionEntity.current_end;
        const chargeAt = subscriptionEntity.charge_at;
        const payId = paymentEntity?.id || subId;
        
        result = await db.$transaction(async (tx) => {
          // Check if this specific payment was already processed
          const existingPayment = await tx.payment.findFirst({
            where: { razorpayPaymentId: payId },
          });

          if (existingPayment) {
            logger.info({ razorpayPaymentId: payId, message: 'Subscription payment already processed' });
            return { skipped: true, reason: 'duplicate_payment' };
          }

          const subscription = await tx.subscription.findFirst({
            where: { razorpaySubId: subId },
          });

          if (!subscription) {
            logger.error({ razorpaySubId: subId, message: 'Subscription not found' });
            return null;
          }

          const nextBillingDate = calculateNextBillingDate(currentEnd, chargeAt);
          const nextDeliveryDate = calculateNextDeliveryDate(chargeAt);

          await tx.subscription.update({
            where: { id: subscription.id },
            data: {
              nextBillingDate,
              nextDeliveryDate,
              status: "active",
            },
          });

          const order = await tx.order.create({
            data: {
              userId: subscription.userId,
              subscriptionId: subscription.id,
              orderType: "subscription",
              status: "pending",
              total: subscription.price,
              razorpayOrderId: subId,
              razorpayPaymentId: payId,
              deliveryDate: nextDeliveryDate,
            },
          });

          await tx.payment.create({
            data: {
              userId: subscription.userId,
              orderId: order.id,
              amount: subscription.price,
              status: "captured",
              razorpayPaymentId: payId,
              razorpayOrderId: subId,
            },
          });

          logger.info({ 
            subscriptionId: subscription.id, 
            orderId: order.id,
            nextBilling: nextBillingDate,
            message: 'Subscription charged, order and payment created' 
          });
          
          return { subscriptionId: subscription.id, orderId: order.id };
        });
        break;
      }

      case "payment.captured": {
        if (!paymentEntity?.order_id || !paymentEntity?.amount || !paymentEntity?.id) break;
        
        const payAmount = paymentEntity.amount;
        const payId = paymentEntity.id;
        const payOrderId = paymentEntity.order_id;
        
        result = await db.$transaction(async (tx) => {
          // Idempotency check
          const existingPayment = await tx.payment.findFirst({
            where: { razorpayPaymentId: payId },
          });

          if (existingPayment) {
            logger.info({ razorpayPaymentId: payId, message: 'One-time payment already processed' });
            return { skipped: true, reason: 'duplicate_payment' };
          }

          const purchase = await tx.oneTimePurchase.findFirst({
            where: { razorpayPaymentLinkId: payOrderId },
          });

          if (!purchase) {
            logger.error({ orderId: payOrderId, message: 'One-time purchase not found' });
            return null;
          }

          const nextDeliveryDate = calculateNextDeliveryDate();

          await tx.oneTimePurchase.update({
            where: { id: purchase.id },
            data: {
              status: "completed",
              razorpayPaymentId: payId,
              nextDeliveryDate,
            },
          });

          const order = await tx.order.create({
            data: {
              userId: purchase.userId,
              orderType: "one_time",
              status: "pending",
              total: purchase.price,
              razorpayOrderId: payOrderId,
              razorpayPaymentId: payId,
              deliveryDate: nextDeliveryDate,
            },
          });

          await tx.payment.create({
            data: {
              userId: purchase.userId,
              orderId: order.id,
              amount: payAmount,
              status: "captured",
              razorpayPaymentId: payId,
              razorpayOrderId: payOrderId,
            },
          });

          logger.info({ 
            purchaseId: purchase.id, 
            orderId: order.id,
            paymentId: payId,
            message: 'One-time payment captured, order and payment created' 
          });
          
          return { purchaseId: purchase.id, orderId: order.id, paymentId: payId };
        });
        break;
      }

      case "payment_link.paid": {
        if (!paymentLinkEntity?.id || !paymentLinkEntity?.amount) break;
        
        const plAmount = paymentLinkEntity.amount;
        const plId = paymentLinkEntity.id;
        const actualPaymentId = paymentEntity?.id || plId;
        
        result = await db.$transaction(async (tx) => {
          // Idempotency check
          const existingPayment = await tx.payment.findFirst({
            where: { razorpayPaymentId: actualPaymentId },
          });

          if (existingPayment) {
            logger.info({ razorpayPaymentId: actualPaymentId, message: 'Payment Link already processed' });
            return { skipped: true, reason: 'duplicate_payment' };
          }

          const purchase = await tx.oneTimePurchase.findFirst({
            where: { razorpayPaymentLinkId: plId },
          });

          if (!purchase) {
            logger.error({ paymentLinkId: plId, message: 'One-time purchase not found' });
            return null;
          }

          const nextDeliveryDate = calculateNextDeliveryDate();

          await tx.oneTimePurchase.update({
            where: { id: purchase.id },
            data: {
              status: "completed",
              razorpayPaymentId: actualPaymentId,
              nextDeliveryDate,
            },
          });

          const order = await tx.order.create({
            data: {
              userId: purchase.userId,
              orderType: "one_time",
              status: "pending",
              total: purchase.price,
              razorpayOrderId: plId,
              razorpayPaymentId: actualPaymentId,
              deliveryDate: nextDeliveryDate,
            },
          });

          await tx.payment.create({
            data: {
              userId: purchase.userId,
              orderId: order.id,
              amount: plAmount,
              status: "captured",
              razorpayPaymentId: actualPaymentId,
              razorpayOrderId: plId,
            },
          });

          logger.info({ 
            purchaseId: purchase.id, 
            orderId: order.id,
            paymentId: actualPaymentId,
            message: 'Payment Link paid, order and payment created' 
          });
          
          return { purchaseId: purchase.id, orderId: order.id, paymentId: actualPaymentId };
        });
        break;
      }

      case "payment.refunded": {
        if (!paymentEntity?.id) break;
        
        const refundPaymentId = paymentEntity.id;
        
        result = await db.$transaction(async (tx) => {
          const payment = await tx.payment.findFirst({
            where: { razorpayPaymentId: refundPaymentId },
          });

          if (payment) {
            await tx.payment.update({
              where: { id: payment.id },
              data: { status: "refunded" },
            });
          }

          if (payment?.orderId) {
            await tx.order.update({
              where: { id: payment.orderId },
              data: { status: "refunded" },
            });
          }

          logger.info({ 
            paymentId: refundPaymentId,
            message: 'Payment refunded' 
          });
          
          return { paymentId: refundPaymentId, refunded: !!payment };
        });
        break;
      }

      case "subscription.paused": {
        if (!subscriptionEntity?.id) break;
        
        await db.subscription.updateMany({
          where: { razorpaySubId: subscriptionEntity.id },
          data: { status: "paused" },
        });
        result = { status: "paused" };
        break;
      }

      case "subscription.resumed": {
        if (!subscriptionEntity?.id) break;
        
        await db.subscription.updateMany({
          where: { razorpaySubId: subscriptionEntity.id },
          data: { status: "active" },
        });
        result = { status: "resumed" };
        break;
      }

      case "subscription.cancelled": {
        if (!subscriptionEntity?.id) break;
        
        await db.subscription.updateMany({
          where: { razorpaySubId: subscriptionEntity.id },
          data: { status: "cancelled" },
        });
        result = { status: "cancelled" };
        break;
      }

      case "subscription.authenticated": {
        if (!subscriptionEntity?.id) break;
        
        const authSubId = subscriptionEntity.id;
        const currentEnd = subscriptionEntity.current_end;
        const chargeAt = subscriptionEntity.charge_at;
        
        result = await db.$transaction(async (tx) => {
          const subscription = await tx.subscription.findFirst({
            where: { razorpaySubId: authSubId },
          });

          if (!subscription) return null;

          const nextBillingDate = calculateNextBillingDate(currentEnd, chargeAt);
          const nextDeliveryDate = calculateNextDeliveryDate(chargeAt);

          await tx.subscription.update({
            where: { id: subscription.id },
            data: {
              status: "active",
              nextBillingDate,
              nextDeliveryDate,
            },
          });

          return { subscriptionId: subscription.id };
        });
        break;
      }

      case "subscription.failed": {
        if (!subscriptionEntity?.id) break;
        
        logger.info({ subscriptionId: subscriptionEntity.id, message: 'Subscription payment failed' });
        result = { status: "failed" };
        break;
      }

      default:
        logger.info({ event, message: 'Unhandled webhook event' });
        result = { unhandled: true };
    }

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

    return NextResponse.json({ received: true, result });
  } catch (error) {
    logger.error({ message: 'Webhook error', error: (error as Error).message });
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
