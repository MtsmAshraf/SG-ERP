import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import Link from "next/link"
import { Package, ExternalLink } from "lucide-react"

export default async function AllPurchaseItemsPage() {
  await requirePermission("canViewPurchaseOrders")

  // ✅ Fetch ONLY custom items (productId is null) from CONFIRMED orders
  const allItems = await prisma.purchaseOrderItem.findMany({
    where: {
      productId: null, // ✅ Only custom/project items
      purchaseOrder: {
        status: "CONFIRMED" // ✅ Only confirmed orders
      }
    },
    orderBy: { purchaseOrder: { createdAt: "desc" } },
    include: {
      purchaseOrder: {
        include: {
          supplier: { select: { name: true } }
        }
      }
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#061228]">بنود المشتريات المخصصة</h1>
          <p className="mt-1 text-sm text-gray-500">تتبع البنود والمشتريات المخصصة للمشاريع من أوامر الشراء المؤكدة.</p>
        </div>
      </div>

      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto force-ltr">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">رقم أمر الشراء</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">المورد</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">اسم البند</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الكمية</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">سعر الوحدة</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                    لا توجد بنود مشتريات مخصصة مسجلة بعد.
                  </td>
                </tr>
              ) : (
                allItems.map((item) => {
                  const itemName = item.productName || "بند غير معروف"
                  const itemUnit = item.unit || ""

                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link 
                          href={`/purchase-orders/${item.purchaseOrder.id}`} 
                          className="inline-flex items-center gap-1 font-bold text-[#061228] hover:text-[#dda322] transition"
                        >
                          {item.purchaseOrder.poNumber}
                          <ExternalLink size={12} />
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {item.purchaseOrder.supplier.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.purchaseOrder.createdAt.toLocaleDateString('ar-EG')}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{itemName}</span>
                          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-800">
                            مخصص
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity} {itemUnit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {item.unitCost.toNumber().toFixed(2)} EGP
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#dda322]">
                        {item.lineTotal.toNumber().toFixed(2)} EGP
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">إجمالي البنود المخصصة</p>
          <p className="mt-1 text-2xl font-bold text-purple-600">{allItems.length}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">إجمالي القيمة</p>
          <p className="mt-1 text-2xl font-bold text-[#061228]">
            {allItems.reduce((sum, item) => sum + item.lineTotal.toNumber(), 0).toFixed(2)} EGP
          </p>
        </div>
      </div>
    </div>
  )
}