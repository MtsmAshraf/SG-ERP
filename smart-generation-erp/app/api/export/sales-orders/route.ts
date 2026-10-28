import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const searchQuery = searchParams.get("search") || ""

  // FIX: Use Prisma.QueryMode.insensitive to satisfy TypeScript strict types
  const where: Prisma.SalesOrderWhereInput = searchQuery
    ? {
        OR: [
          { orderNumber: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } },
          { customer: { name: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } } },
        ],
      }
    : {}

  const orders = await prisma.salesOrder.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  })

  // Generate CSV Header
  const csvRows = [
    ["Order Number", "Customer", "Date", "Total", "Status"].join(","),
  ]

  // Generate CSV Rows
  for (const order of orders) {
    const row = [
      order.orderNumber,
      `"${order.customer.name.replace(/"/g, '""')}"`, // Escape quotes in names
      order.createdAt.toISOString().split("T")[0],
      order.total.toNumber().toFixed(2),
      order.status,
    ]
    csvRows.push(row.join(","))
  }

  const csvContent = csvRows.join("\n")

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="sales-orders.csv"`,
    },
  })
}