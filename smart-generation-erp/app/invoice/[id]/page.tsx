import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { PrintButton } from "../PrintButton"

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  
  // Protect the route (Middleware already does this, but this is a good fallback)
  if (!session) redirect("/login")

  const order = await prisma.salesOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      items: { include: { product: true } },
      createdBy: true
    }
  })

  if (!order) notFound()
  
  // Block printing for drafts or cancelled orders
  if (order.status === "DRAFT" || order.status === "CANCELLED") {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600">Cannot Print Draft/Cancelled Orders</h1>
        <p className="mt-2 text-gray-600">Please confirm the order before generating an invoice.</p>
        <Link href={`/sales-orders/${id}`} className="mt-4 inline-block text-blue-600 hover:underline">
          Back to Order
        </Link>
      </div>
    )
  }

  return (
    // print: classes ensure the background is white and padding is removed when printing
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto max-w-3xl bg-white p-8 shadow-lg print:max-w-none print:p-0 print:shadow-none">
        
        {/* Controls - Hidden when printing */}
        <div className="mb-6 flex justify-end print:hidden">
          <Link href={`/sales-orders/${id}`} className="mr-4 rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Back to Order
          </Link>
          <PrintButton />
        </div>

        {/* Invoice Header */}
        <div className="flex justify-between border-b pb-8 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
            <p className="mt-2 text-gray-500">Order #{order.orderNumber}</p>
            <p className="text-gray-500">Date: {order.createdAt.toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-900">Your Company Name</h2>
            <p className="text-gray-600">123 Business Rd.</p>
            <p className="text-gray-600">City, State, Zip</p>
            <p className="text-gray-600">contact@yourcompany.com</p>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold uppercase text-gray-500">Bill To:</h3>
          <p className="mt-2 text-lg font-bold text-gray-900">{order.customer.name}</p>
          <p className="text-gray-600">{order.customer.email}</p>
          <p className="text-gray-600">{order.customer.phone}</p>
          <p className="text-gray-600 whitespace-pre-line">{order.customer.address}</p>
        </div>

        {/* Items Table */}
        <table className="w-full border-collapse mb-8">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">Item</th>
              <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">SKU</th>
              <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold text-gray-900">Qty</th>
              <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold text-gray-900">Unit Price</th>
              <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold text-gray-900">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">{item.product.name}</td>
                <td className="border border-gray-300 px-4 py-2 text-sm text-gray-600">{item.product.sku}</td>
                <td className="border border-gray-300 px-4 py-2 text-sm text-right text-gray-900">{item.quantity}</td>
                <td className="border border-gray-300 px-4 py-2 text-sm text-right text-gray-900">{item.unitPrice.toNumber().toFixed(2)} EGP</td>
                <td className="border border-gray-300 px-4 py-2 text-sm text-right text-gray-900">{item.lineTotal.toNumber().toFixed(2)} EGP</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64">
            <div className="flex justify-between border-t-2 border-gray-900 pt-2 text-xl font-bold text-gray-900">
              <span>Total:</span>
              <span>{order.total.toNumber().toFixed(2)} EGP</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 border-t pt-8 text-center text-sm text-gray-500">
          <p>Thank you for your business!</p>
          <p className="mt-2">Generated by {order.createdBy.name} on {new Date().toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  )
}