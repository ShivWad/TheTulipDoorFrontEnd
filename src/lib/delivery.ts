export const DELIVERY_CUTOFF_HOUR = 18;
export const DELIVERY_CUTOFF_MINUTE = 0;
export const IST_OFFSET_HOURS = 5.5;

export function getISTDate(): Date {
  const now = new Date();
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utcTime + (IST_OFFSET_HOURS * 60 * 60 * 1000));
}

export function isDeliveryCutoffPassed(): boolean {
  const istNow = getISTDate();
  const currentHour = istNow.getHours();
  const currentMinute = istNow.getMinutes();
  return currentHour > DELIVERY_CUTOFF_HOUR || 
         (currentHour === DELIVERY_CUTOFF_HOUR && currentMinute >= DELIVERY_CUTOFF_MINUTE);
}

export function calculateNextDeliveryDate(chargeTimestamp?: number): Date {
  let baseDate: Date;
  
  if (chargeTimestamp) {
    baseDate = new Date(chargeTimestamp * 1000);
  } else {
    baseDate = getISTDate();
  }
  
  const daysUntilSaturday = (6 - baseDate.getDay() + 7) % 7 || 7;
  baseDate.setDate(baseDate.getDate() + daysUntilSaturday);
  
  if (isDeliveryCutoffPassed() && baseDate.getDay() === 6) {
    baseDate.setDate(baseDate.getDate() + 7);
  }
  
  return baseDate;
}
