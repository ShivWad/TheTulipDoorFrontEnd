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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const paymentId = searchParams.get('razorpay_payment_id');
  const paymentLinkId = searchParams.get('razorpay_payment_link_id');
  const signature = searchParams.get('razorpay_signature');
  const subscriptionId = searchParams.get('razorpay_subscription_id');
  
  console.log(">>> CALLBACK RECEIVED:", { paymentId, paymentLinkId, signature: signature ? 'present' : 'missing', subscriptionId });
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://thetulipdoor.com';

  // Check if this is a subscription callback or payment link callback
  if (subscriptionId) {
    // Subscription callback
    return NextResponse.redirect(`${baseUrl}/account/rituals?payment=success`);
  }

  // Payment Link callback
  if (!paymentLinkId || !paymentId || !signature) {
    logger.error({ message: 'Missing callback parameters', paymentLinkId, paymentId, signature: signature ? 'present' : 'missing' });
    console.log(">>> CALLBACK FAILED - Missing params:", { paymentLinkId, paymentId, hasSignature: !!signature });
    return NextResponse.redirect(`${baseUrl}/account/rituals?payment=failed`);
  }

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.error({ message: 'Missing RAZORPAY_WEBHOOK_SECRET' });
    return NextResponse.redirect(`${baseUrl}/account/rituals?payment=failed`);
  }

  const isValid = verifyPaymentLinkSignature(paymentLinkId, paymentId, signature, webhookSecret);
  
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
