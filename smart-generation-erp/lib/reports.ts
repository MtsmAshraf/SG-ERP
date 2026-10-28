import { prisma } from "@/lib/prisma"

// Helper to format date as YYYY-MM for grouping
const getMonthKey = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export async function getSalesVsPurchasesData() {
  // Fetch last 6 months of confirmed orders
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const [sales, purchases] = await Promise.all([
    prisma.salesOrder.findMany({
      where: { status: "CONFIRMED", createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, total: true }
    }),
    prisma.purchaseOrder.findMany({
      where: { status: "CONFIRMED", createdAt: { gte: sixMonthsAgo } },
      select: { createdAt: true, total: true }
    })
  ])

  // Group by month
  const dataMap = new Map<string, { month: string, sales: number, purchases: number }>()

  const processOrders = (orders: any[], type: 'sales' | 'purchases') => {
    orders.forEach(order => {
      const key = getMonthKey(order.createdAt)
      if (!dataMap.has(key)) dataMap.set(key, { month: key, sales: 0, purchases: 0 })
      const entry = dataMap.get(key)!
      entry[type] += order.total.toNumber()
    })
  }

  processOrders(sales, 'sales')
  processOrders(purchases, 'purchases')

  // Convert to array and sort by date
  return Array.from(dataMap.values()).sort((a, b) => a.month.localeCompare(b.month))
}

export async function getTopProductsData() {
  // Get top 5 products by revenue from confirmed sales orders
  const topItems = await prisma.orderItem.findMany({
    where: { salesOrder: { status: "CONFIRMED" } },
    include: { product: { select: { name: true } } },
    orderBy: { lineTotal: "desc" },
    take: 100 // Fetch top 100 items to aggregate
  })

  const productMap = new Map<string, { name: string, revenue: number }>()

  topItems.forEach(item => {
    const name = item.product.name
    if (!productMap.has(name)) productMap.set(name, { name, revenue: 0 })
    productMap.get(name)!.revenue += item.lineTotal.toNumber()
  })

  return Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5) // Top 5
}

export async function getTopCustomersData() {
  const topOrders = await prisma.salesOrder.findMany({
    where: { status: "CONFIRMED" },
    include: { customer: { select: { name: true } } },
    orderBy: { total: "desc" },
    take: 100
  })

  const customerMap = new Map<string, { name: string, revenue: number }>()

  topOrders.forEach(order => {
    const name = order.customer.name
    if (!customerMap.has(name)) customerMap.set(name, { name, revenue: 0 })
    customerMap.get(name)!.revenue += order.total.toNumber()
  })

  return Array.from(customerMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5) // Top 5
}