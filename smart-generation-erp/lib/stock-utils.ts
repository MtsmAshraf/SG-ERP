import { prisma } from "@/lib/prisma"

export async function getStockBreakdown(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { currentStock: true, name: true, unit: true }
  })
  if (!product) return null

  const [depositQty, custodyQty] = await Promise.all([
    prisma.depositItem.aggregate({
      _sum: { quantity: true },
      where: { productId, status: "BORROWED" }
    }),
    prisma.custodyItem.aggregate({
      _sum: { quantity: true },
      where: { productId, status: "BORROWED" }
    })
  ])

  const warehouse = product.currentStock
  const deposit = depositQty._sum.quantity || 0
  const custody = custodyQty._sum.quantity || 0
  const total = warehouse + deposit + custody

  return { total, warehouse, deposit, custody, unit: product.unit }
}