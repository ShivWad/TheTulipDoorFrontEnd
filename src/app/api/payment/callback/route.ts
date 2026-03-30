/**
 * Payment Callback Handler
 * 
 * GET /api/payment/callback
 * 
 * Handles the redirect from Razorpay after payment.
 * Verifies the signature and updates the database.
 * 
 * Query Parameters:
 * - razorpay_payment_id: Payment ID from Razorpay
 * - razorpay_payment_link_id: Payment Link ID from Razorpay  
 * - razorpay_signature: Signature from Razorpay for verification
 * - razorpay_subscription_id: Subscription ID (for subscriptions)
 * 
 * Redirects to:
 * - /account/rituals?payment=success - on success
 * - /account/rituals?payment=failed - on failure
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPaymentLinkSignature, verifySubscriptionSignature } from "@/lib/razorpay-verify";
import { calculateNextDeliveryDate } from "@/lib/delivery";
import logger from "@/lib/logger";
import { getAppUrl } from "@/lib/app-url";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const paymentId = searchParams.get('razorpay_payment_id');
  const paymentLinkId = searchParams.get('razorpay_payment_link_id');
  const signature = searchParams.get('razorpay_signature');
  const subscriptionId = searchParams.get('razorpay_subscription_id');
  const referenceId = searchParams.get('razorpay_payment_link_reference_id') || '';
  const paymentStatus = searchParams.get('razorpay_payment_link_status') || 'paid';
  
  console.log(">>> CALLBACK RECEIVED:", { paymentId, paymentLinkId, signature: signature ? 'present' : 'missing', subscriptionId });
  
  const baseUrl = getAppUrl();

  // Check if this is a subscription callback or payment link callback
  if (subscriptionId) {
    // Subscription callback - verify signature using KEY_SECRET
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!keySecret) {
      logger.error({ message: 'Missing RAZORPAY_KEY_SECRET' });
      return NextResponse.redirect(`${baseUrl}/account/rituals?payment=failed`);
    }
    
    if (!signature || !paymentId) {
      logger.error({ message: 'Missing subscription callback parameters', subscriptionId, paymentId, hasSignature: !!signature });
      return NextResponse.redirect(`${baseUrl}/account/rituals?payment=failed`);
    }
    
    const isValidSub = verifySubscriptionSignature(subscriptionId, paymentId, signature, keySecret);
    if (!isValidSub) {
      logger.error({ message: 'Invalid subscription signature', subscriptionId });
      return NextResponse.redirect(`${baseUrl}/account/rituals?payment=failed`);
    }
    
    // Provision subscription in database if not already done by webhook
    try {
      // 1. Check if this specific payment was already processed (idempotency)
      const existingPaymentOrder = await db.order.findFirst({
        where: { razorpayPaymentId: paymentId },
      });

      if (existingPaymentOrder) {
        logger.info({ message: 'Subscription order already exists (webhook processed)', paymentId });
        return NextResponse.redirect(`${baseUrl}/account/rituals?payment=success`);
      }

      const existingSub = await db.subscription.findFirst({
        where: { razorpaySubId: subscriptionId },
      });

      if (!existingSub) {
        logger.error({ message: 'Subscription not found in database', subscriptionId });
        return NextResponse.redirect(`${baseUrl}/account/rituals?payment=failed`);
      }

      // 2. If subscription is still pending or needs updating, do it in a transaction
      await db.$transaction(async (tx) => {
        const nextDeliveryDate = calculateNextDeliveryDate();
        
        if (existingSub.status === 'pending') {
          await tx.subscription.update({
            where: { id: existingSub.id },
            data: {
              status: 'active',
              nextDeliveryDate,
            },
          });
        }

        const order = await tx.order.create({
          data: {
            userId: existingSub.userId,
            subscriptionId: existingSub.id,
            orderType: 'subscription',
            status: 'confirmed',
            total: existingSub.price,
            razorpayOrderId: subscriptionId,
            razorpayPaymentId: paymentId,
            deliveryDate: nextDeliveryDate,
          },
        });

        await tx.payment.create({
          data: {
            userId: existingSub.userId,
            orderId: order.id,
            amount: existingSub.price,
            status: 'captured',
            razorpayPaymentId: paymentId,
            razorpayOrderId: subscriptionId,
          },
        });
      });

      logger.info({ message: 'Subscription callback - subscription activated and order created', subscriptionId, paymentId });
    } catch (error) {
      logger.error({ message: 'Subscription callback processing error', error: (error as Error).message });
      return NextResponse.redirect(`${baseUrl}/account/rituals?payment=failed`);
    }
    
    return NextResponse.redirect(`${baseUrl}/account/rituals?payment=success`);
  }

  // Payment Link callback
  if (!paymentLinkId || !paymentId || !signature) {
    logger.error({ message: 'Missing callback parameters', paymentLinkId, paymentId, signature: signature ? 'present' : 'missing' });
    console.log(">>> CALLBACK FAILED - Missing params:", { paymentLinkId, paymentId, hasSignature: !!signature });
    return NextResponse.redirect(`${baseUrl}/account/rituals?payment=failed`);
  }

  // Use KEY_SECRET for callback verification (not WEBHOOK_SECRET)
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    logger.error({ message: 'Missing RAZORPAY_KEY_SECRET' });
    return NextResponse.redirect(`${baseUrl}/account/rituals?payment=failed`);
  }

  const isValid = verifyPaymentLinkSignature(paymentLinkId, paymentId, signature, keySecret, referenceId, paymentStatus);
  
  if (!isValid) {
    logger.error({ message: 'Invalid payment signature', paymentLinkId, paymentId });
    return NextResponse.redirect(`${baseUrl}/account/rituals?payment=failed`);
  }

  try {
    const purchase = await db.oneTimePurchase.findFirst({
      where: { razorpayPaymentLinkId: paymentLinkId },
    });

    if (!purchase) {
      logger.error({ message: 'Purchase not found', paymentLinkId });
      return NextResponse.redirect(`${baseUrl}/account/rituals?payment=failed`);
    }

    // Check if already processed (by webhook)
    const existingOrder = await db.order.findFirst({
      where: { razorpayOrderId: paymentLinkId },
    });

    if (existingOrder) {
      logger.info({ message: 'Order already exists (webhook processed)', paymentLinkId });
      return NextResponse.redirect(`${baseUrl}/account/rituals?payment=success`);
    }

    if (purchase.status === 'pending') {
      const nextDeliveryDate = calculateNextDeliveryDate();
      
      await db.oneTimePurchase.update({
        where: { id: purchase.id },
        data: {
          status: 'completed',
          razorpayPaymentId: paymentId,
          nextDeliveryDate,
        },
      });

      await db.order.create({
        data: {
          userId: purchase.userId,
          orderType: 'one_time',
          status: 'confirmed',
          total: purchase.price,
          razorpayOrderId: paymentLinkId,
          razorpayPaymentId: paymentId,
          deliveryDate: nextDeliveryDate,
        },
      });

      await db.payment.create({
        data: {
          userId: purchase.userId,
          amount: purchase.price,
          status: 'captured',
          razorpayPaymentId: paymentId,
          razorpayOrderId: paymentLinkId,
        },
      });

      logger.info({ message: 'Payment callback - purchase completed', purchaseId: purchase.id, paymentId });
    }

    return NextResponse.redirect(`${baseUrl}/account/rituals?payment=success`);
  } catch (error) {
    logger.error({ message: 'Payment callback error', error: (error as Error).message });
    return NextResponse.redirect(`${baseUrl}/account/rituals?payment=failed`);
  }
}
