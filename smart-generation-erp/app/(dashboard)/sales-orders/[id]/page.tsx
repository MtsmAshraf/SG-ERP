import { prisma } from "@/lib/prisma"
import { requireRole } from "@/lib/auth-utils"
import { notFound } from "next/navigation"
import { addOrderItem, removeOrderItem, confirmSalesOrder } from "../actions"
import { AddOrderItemForm } from "../AddOrderItemForm"
import Link from "next/link"
import { serializeProduct } from "@/lib/utils"
import { FileText } from "lucide-react"
import { generateInvoice } from "../../invoices/actions"

export default async function SalesOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireRole("ADMIN", "STAFF")
  const isAdmin = session.user.role === "ADMIN"

  const order = await prisma.salesOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      createdBy: { select: { name: true } },
      convertedFromOffer: { select: { offerNumber: true } },
      items: {
        include: { product: true }
      }
    }
  })

  if (!order) notFound()

  const products = (await prisma.product.findMany({
    orderBy: { name: "asc" }
  })).map(product => serializeProduct(product))

  const isDraft = order.status === "DRAFT"
  
  // STAFF can only add items if:
  // 1. The order was NOT created from a price offer, OR
  // 2. The user is ADMIN
  const canAddItems = isDraft && (isAdmin || !order.convertedFromOfferId)

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link href="/sales-orders" className="text-sm text-blue-600 hover:underline">
          ← Back to Sales Orders
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Order {order.orderNumber}</h1>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${
            order.status === "DRAFT" ? "bg-yellow-100 text-yellow-800" : 
            order.status === "CONFIRMED" ? "bg-green-100 text-green-800" : 
            "bg-gray-100 text-gray-800"
          }`}>
            {order.status}
          </span>
        </div>
      </div>

      {/* Info banner if order came from a price offer */}
      {order.convertedFromOffer && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">ℹ️ Created from Price Offer:</span>{" "}
            <Link href={`/price-offers/${order.convertedFromOfferId}`} className="underline font-bold hover:text-blue-900">
              {order.convertedFromOffer.offerNumber}
            </Link>
            {!isAdmin && (
              <span className="ml-2 text-xs">(Items are locked per the approved offer)</span>
            )}
          </p>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Customer</p>
          <p className="text-lg font-semibold text-gray-900">
            <Link href={`/customers/${order.customerId}`} className="text-blue-600 hover:text-blue-900">
              {order.customer.name}
            </Link>
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Date</p>
          <p className="text-lg font-semibold text-gray-900">{order.createdAt.toLocaleDateString()}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">${order.total.toNumber().toFixed(2)}</p>
        </div>
      </div>

      <div className="mb-8 rounded-lg border bg-white shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-lg font-bold text-gray-900">Order Items</h2>
        </div>
        
        {canAddItems && (
          <AddOrderItemForm salesOrderId={order.id} products={products} />
        )}

        {/* Message for STAFF when items are locked */}
        {isDraft && !canAddItems && !isAdmin && (
          <div className="border-b bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">🔒 Items Locked:</span> This order was created from an approved price offer. 
              Only an admin can add or remove items.
            </p>
          </div>
        )}

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Product</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">SKU</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Qty</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Unit Price</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Total</th>
              {canAddItems && <th className="px-4 py-3"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {order.items.length === 0 ? (
              <tr>
                <td colSpan={canAddItems ? 6 : 5} className="px-4 py-6 text-center text-sm text-gray-500">
                  No items added yet.
                </td>
              </tr>
            ) : (
              order.items.map((item) => (
                <tr key={item.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{item.product.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{item.product.sku}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">${item.unitPrice.toNumber().toFixed(2)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">${item.lineTotal.toNumber().toFixed(2)}</td>
                  {canAddItems && (
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                      <form action={removeOrderItem}>
                        <input type="hidden" name="itemId" value={item.id} />
                        <input type="hidden" name="salesOrderId" value={order.id} />
                        <button type="submit" className="text-red-600 hover:text-red-900">Remove</button>
                      </form>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isDraft && order.items.length > 0 && (
        <div className="flex justify-end">
          <form action={confirmSalesOrder}>
            <input type="hidden" name="salesOrderId" value={order.id} />
            <button type="submit" className="rounded bg-green-600 px-6 py-3 text-base font-medium text-white hover:bg-green-700 shadow-sm">
              Confirm Order & Deduct Stock
            </button>
          </form>
        </div>
      )}
      
      {order.status === "CONFIRMED" && (
        <>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center text-green-800">
          This order has been confirmed and stock has been deducted.
        </div>
        <form action={generateInvoice}>
          <input type="hidden" name="salesOrderId" value={order.id} />
          <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-[#061228] px-4 py-2 text-sm font-medium text-white hover:bg-[#050e20] transition shadow-sm">
            <FileText size={16} /> إصدار فاتورة
          </button>
        </form>
        </>
      )}
    </div>
  )
}