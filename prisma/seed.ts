import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const plans = [
  {
    planKey: "solo",
    name: "The Solo",
    description: "12-15 Stems - Delivered weekly",
    price: 180000, // ₹1800 in paise
    stems: "12-15 Stems",
  },
  {
    planKey: "studio",
    name: "The Studio",
    description: "24-30 Stems - Delivered weekly",
    price: 340000, // ₹3400 in paise
    stems: "24-30 Stems",
  },
  {
    planKey: "gallery",
    name: "The Gallery",
    description: "40+ Stems - Delivered weekly",
    price: 480000, // ₹4800 in paise
    stems: "40+ Stems",
  },
];

async function main() {
  console.log("Seeding subscription plans...");

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { planKey: plan.planKey },
      update: {},
      create: plan,
    });
    console.log(`Created/updated plan: ${plan.name}`);
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
