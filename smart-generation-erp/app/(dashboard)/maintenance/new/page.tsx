import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import NewMaintenanceForm from "./NewMaintenanceForm"

export default async function NewMaintenancePage() {
  await requirePermission("canManageMaintenance")

  const [products, customers, salesOrders] = await Promise.all([
    prisma.product.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        sku: true,
        serialNumbers: {
          where: { status: "IN_STOCK" },
          select: { id: true, serialNumber: true }
        }
      }
    }),
    prisma.customer.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    }),
    prisma.salesOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, orderNumber: true }
    })
  ])

  return <NewMaintenanceForm products={products} customers={customers} salesOrders={salesOrders} />
}