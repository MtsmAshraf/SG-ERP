import { prisma } from "@/lib/prisma"
import { requirePermission, getUserPermissions } from "@/lib/auth-utils"
import { notFound } from "next/navigation"
import { addOrderItem, removeOrderItem, confirmSalesOrder } from "../actions"
import { AddOrderItemForm } from "../AddOrderItemForm"
import Link from "next/link"
import { serializeProduct } from "@/lib/utils"
import { FileText, AlertCircle } from "lucide-react"
import { generateInvoice } from "../../invoices/actions"

export default async function SalesOrderDetailsPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ error?: string }> 
}) {
  const { id } = await params
  const { error } = await searchParams
  
  await requirePermission("canViewSalesOrders")
  const permissions = await getUserPermissions()

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

  // ✅ FIX 1: Add return null to satisfy TypeScript that execution stops here
  if (!order) {
    notFound()
    return null
  }

  const products = (await prisma.product.findMany({
    orderBy: { name: "asc" }
  })).map(product => serializeProduct(product))

  const isDraft = order.status === "DRAFT"
  
  // ✅ FIX 2: Use canCreateSalesOrders for editing drafts
  const canEditItems = isDraft && permissions?.canCreateSalesOrders

  return (
    <div className="mx-auto max-w-4xl space-y-6" dir="rtl">
      
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mb-6">
        <Link href="/sales-orders" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-[#dda322] transition mb-2">
          ← العودة إلى أوامر البيع
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#061228]">أمر البيع {order.orderNumber}</h1>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${
            order.status === "DRAFT" ? "bg-yellow-100 text-yellow-800" : 
            order.status === "CONFIRMED" ? "bg-green-100 text-green-800" : 
            "bg-gray-100 text-gray-800"
          }`}>
            {order.status === "DRAFT" ? "مسودة" : order.status === "CONFIRMED" ? "مؤكد" : order.status}
          </span>
        </div>
      </div>

      {/* Info banner if order came from a price offer */}
      {order.convertedFromOffer && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">ℹ️ تم الإنشاء من عرض سعر:</span>{" "}
            {/* ✅ FIX 3: Added ! to convertedFromOfferId since we know it exists */}
            <Link href={`/price-offers/${order.convertedFromOfferId!}`} className="underline font-bold hover:text-blue-900">
              {order.convertedFromOffer.offerNumber}
            </Link>
            {!canEditItems && (
              <span className="mr-2 text-xs">(العناصر مقفلة وفقاً لعرض السعر المعتمد)</span>
            )}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">العميل</p>
          <p className="text-lg font-semibold text-gray-900">
            {order.customer ? (
              // ✅ FIX 4: Added ! to customerId since we checked order.customer exists
              <Link href={`/customers/${order.customerId!}`} className="text-[#dda322] hover:text-[#b8861b]">
                {order.customer.name}
              </Link>
            ) : (
              "غير محدد"
            )}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">التاريخ</p>
          <p className="text-lg font-semibold text-gray-900">{order.createdAt.toLocaleDateString("ar-EG")}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">الإجمالي</p>
          <p className="text-2xl font-bold text-gray-900">{order.total.toNumber().toFixed(2)} EGP</p>
        </div>
      </div>

      <div className="rounded-lg border bg-white shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-lg font-bold text-[#061228]">عناصر أمر البيع</h2>
        </div>
        
        {canEditItems && (
          <div className="p-4 border-b">
            <AddOrderItemForm salesOrderId={order.id} products={products} />
          </div>
        )}

        {isDraft && !canEditItems && (
          <div className="border-b bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">🔒 العناصر مقفلة:</span> تم إنشاء هذا الأمر من عرض سعر معتمد أو ليس لديك صلاحية التعديل.
            </p>
          </div>
        )}

        <div className="overflow-x-auto force-ltr">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">المنتج</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">الكمية</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">سعر الوحدة</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">الإجمالي</th>
                {canEditItems && <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {order.items.length === 0 ? (
                <tr>
                  <td colSpan={canEditItems ? 6 : 5} className="px-4 py-6 text-center text-sm text-gray-500">
                    لم تتم إضافة أي عناصر بعد.
                  </td>
                </tr>
              ) : (
                order.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{item.product.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">{item.product.sku}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">{item.unitPrice.toNumber().toFixed(2)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-900">{item.lineTotal.toNumber().toFixed(2)}</td>
                    {canEditItems && (
                      <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                        <form action={removeOrderItem}>
                          <input type="hidden" name="itemId" value={item.id} />
                          <input type="hidden" name="salesOrderId" value={order.id} />
                          <button type="submit" className="text-red-600 hover:text-red-900 font-medium">حذف</button>
                        </form>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isDraft && order.items.length > 0 && canEditItems && (
        <div className="flex justify-end">
          <form action={confirmSalesOrder}>
            <input type="hidden" name="salesOrderId" value={order.id} />
            <button type="submit" className="rounded-lg bg-green-600 px-6 py-3 text-base font-medium text-white hover:bg-green-700 shadow-sm transition">
              تأكيد الأمر وخصم المخزون
            </button>
          </form>
        </div>
      )}
      
      {order.status === "CONFIRMED" && (
        <div className="space-y-4">
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center text-green-800">
            تم تأكيد هذا الأمر وتم خصم الكميات من المخزون.
          </div>
          <form action={generateInvoice} className="flex justify-end">
            <input type="hidden" name="salesOrderId" value={order.id} />
            <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-[#061228] px-4 py-2 text-sm font-medium text-white hover:bg-[#050e20] transition shadow-sm">
              <FileText size={16} /> إصدار فاتورة
            </button>
          </form>
        </div>
      )}
    </div>
  )
}