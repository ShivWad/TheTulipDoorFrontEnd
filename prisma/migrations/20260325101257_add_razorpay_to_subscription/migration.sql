/*
  Warnings:

  - You are about to drop the column `frequency` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `nextDelivery` on the `Subscription` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "frequency",
DROP COLUMN "nextDelivery",
ADD COLUMN     "nextBillingDate" TIMESTAMP(3),
ADD COLUMN     "nextDeliveryDate" TIMESTAMP(3),
ADD COLUMN     "razorpayCustomerId" TEXT,
ADD COLUMN     "razorpaySubId" TEXT;
