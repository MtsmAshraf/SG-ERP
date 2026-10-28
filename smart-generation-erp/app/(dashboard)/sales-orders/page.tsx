import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { requirePermission, requireRole } from "@/lib/auth-utils"
import { Pagination } from "@/components/Pagination"
import { PAGE_SIZE } from "@/lib/pagination"
import Link from "next/link"
import { Search } from "lucide-react"
import { getCurrencySymbol } from "@/lib/settings"

export default async function SalesOrdersPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  await requirePermission("canViewSalesOrders")
  await requireRole("ADMIN", "STAFF")

  const session = await requireRole("ADMIN", "STAFF")
  const params = await searchParams
  const currentPage = Number(params.page) || 1
  const searchQuery = (params.search as string) || ""
  const currency = await getCurrencySymbol()

  const where: Prisma.SalesOrderWhereInput = searchQuery
    ? {
        OR: [
          { orderNumber: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } },
          { customer: { name: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } } },
        ],
      }
    : {}

  const [orders, totalItems] = await Promise.all([
    prisma.salesOrder.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { customer: true },
    }),
    prisma.salesOrder.count({ where }),
  ])

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Sales Orders</h1>
        <div className="flex gap-2">
          <a
            href={`/api/export/sales-orders${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ""}`}
            className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            ↓ Export CSV
          </a>
          {session.user.role === "ADMIN" && (
            <Link
              href="/sales-orders/new"
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + New Order
            </Link>
          )}
        </div>
      </div>

      <div className="mb-4">
        <form className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            name="search"
            defaultValue={searchQuery}
            placeholder="Search by Order # or Customer..."
            className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button type="submit" className="sr-only">Search</button>
        </form>
      </div>

      <div className="overflow-hidden rounded-t-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Order #</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No orders found matching "{searchQuery}".
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-gray-900">{order.orderNumber}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <Link href={`/customers/${order.customer.id}`} className="text-blue-600 hover:text-blue-900">
                      {order.customer.name}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{order.createdAt.toLocaleDateString()}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{currency} {order.total.toNumber().toFixed(2)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      order.status === "DRAFT" ? "bg-yellow-100 text-yellow-800" : 
                      order.status === "CONFIRMED" ? "bg-green-100 text-green-800" : 
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                    <Link href={`/sales-orders/${order.id}`} className="text-blue-600 hover:text-blue-900">
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination 
        totalItems={totalItems} 
        currentPage={currentPage} 
        baseUrl="/sales-orders" 
        searchQuery={searchQuery} 
      />
    </div>
  )
}