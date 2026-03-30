import crypto from 'crypto';

export function verifySubscriptionSignature(
  subscriptionId: string,
  paymentId: string,
  signature: string,
  secret: string
): boolean {
  const payload = `${paymentId}|${subscriptionId}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return signature === expectedSignature;
}

export function verifyPaymentLinkSignature(
  paymentLinkId: string,
  paymentId: string,
  signature: string,
  secret: string,
  referenceId: string = '',
  status: string = 'paid'
): boolean {
  const payload = `${paymentLinkId}|${referenceId}|${status}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return signature === expectedSignature;
}
