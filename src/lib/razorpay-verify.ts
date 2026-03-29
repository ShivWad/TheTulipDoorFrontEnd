import crypto from 'crypto';

export function verifyPaymentLinkSignature(
  paymentLinkId: string,
  paymentId: string,
  signature: string,
  secret: string
): boolean {
  const payload = `${paymentLinkId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return signature === expectedSignature;
}

export function verifySubscriptionSignature(
  subscriptionId: string,
  paymentId: string,
  signature: string,
  secret: string
): boolean {
  const payload = `${subscriptionId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return signature === expectedSignature;
}
