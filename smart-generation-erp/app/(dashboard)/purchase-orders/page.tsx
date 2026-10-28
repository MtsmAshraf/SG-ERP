import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import Link from "next/link"
import { Eye } from "lucide-react"
import { getCurrencySymbol } from "@/lib/settings"

export default async function PurchaseOrdersPage() {
  await requirePermission("canViewPurchaseOrders")
  const currency = await getCurrencySymbol()

  const purchaseOrders = await prisma.purchaseOrder.findMany({
    orderBy: { createdAt: "desc" },
    include: { supplier: true },
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800"
      case "APPROVED": return "bg-blue-100 text-blue-800"
      case "CONFIRMED": return "bg-green-100 text-green-800"
      case "REJECTED": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING": return "قيد الانتظار"
      case "APPROVED": return "معتمد"
      case "CONFIRMED": return "مؤكد"
      case "REJECTED": return "مرفوض"
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#061228]">أوامر الشراء</h1>
          <p className="mt-1 text-sm text-gray-500">إدارة ومتابعة أوامر الشراء من الموردين.</p>
        </div>
        <Link 
          href="/purchase-orders/new" 
          className="inline-flex justify-center items-center px-4 py-2 bg-[#dda322] text-white rounded-lg hover:bg-[#b8861b] transition font-medium shadow-sm"
        >
          + إنشاء أمر شراء جديد
        </Link>
      </div>

      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto force-ltr">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">رقم الأمر</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">المورد</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الإجمالي</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {purchaseOrders.map((po) => (
                <tr key={po.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{po.poNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{po.supplier.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{po.createdAt.toLocaleDateString('en-US')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{currency} {po.total.toNumber().toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(po.status)}`}>
                      {getStatusText(po.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/purchase-orders/${po.id}`} className="text-[#dda322] hover:text-[#b8861b] p-1 rounded hover:bg-[#dda322]/10 transition" title="عرض التفاصيل">
                        <Eye size={18} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {purchaseOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">لا توجد أوامر شراء حالياً.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}