import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

// Setup the adapter (same as your working seed)
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await hash("SuperAdmin123!", 10);

  // Create or update SUPER_ADMIN user
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@erp.local" },
    update: {},
    create: {
      email: "superadmin@erp.local",
      name: "Super Admin",
      password: hashedPassword,
      role: "SUPER_ADMIN",
    },
  });

  // Create permission record for SUPER_ADMIN with all permissions enabled
  await prisma.permission.upsert({
    where: { userId: superAdmin.id },
    update: {
      canViewDashboard: true,
      canViewProducts: true,
      canViewCustomers: true,
      canViewSuppliers: true,
      canViewPurchaseOrders: true,
      canViewPriceOffers: true,
      canViewSalesOrders: true,
      canViewUsers: true,
      canCreateProducts: true,
      canEditProducts: true,
      canDeleteProducts: true,
      canAdjustStock: true,
      canCreateCustomers: true,
      canEditCustomers: true,
      canCreateSuppliers: true,
      canEditSuppliers: true,
      canCreatePurchaseOrders: true,
      canApprovePurchaseOrders: true,
      canConfirmPurchaseOrders: true,
      canCreatePriceOffers: true,
      canApprovePriceOffers: true,
      canConvertPriceOffers: true,
      canCreateSalesOrders: true,
      canConfirmSalesOrders: true,
      canCreateUsers: true,
      canDeleteUsers: true,
      canExportData: true,
    },
    create: {
      userId: superAdmin.id,
      canViewDashboard: true,
      canViewProducts: true,
      canViewCustomers: true,
      canViewSuppliers: true,
      canViewPurchaseOrders: true,
      canViewPriceOffers: true,
      canViewSalesOrders: true,
      canViewUsers: true,
      canCreateProducts: true,
      canEditProducts: true,
      canDeleteProducts: true,
      canAdjustStock: true,
      canCreateCustomers: true,
      canEditCustomers: true,
      canCreateSuppliers: true,
      canEditSuppliers: true,
      canCreatePurchaseOrders: true,
      canApprovePurchaseOrders: true,
      canConfirmPurchaseOrders: true,
      canCreatePriceOffers: true,
      canApprovePriceOffers: true,
      canConvertPriceOffers: true,
      canCreateSalesOrders: true,
      canConfirmSalesOrders: true,
      canCreateUsers: true,
      canDeleteUsers: true,
      canExportData: true,
    },
  });

  console.log("✅ Seed complete: Created superadmin@erp.local / SuperAdmin123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });