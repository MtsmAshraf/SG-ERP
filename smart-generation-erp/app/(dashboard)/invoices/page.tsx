import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import Link from "next/link"
import { FileText, Printer } from "lucide-react"
import { MarkInvoicePaidButton } from "./MarkInvoicePaidButton"
import { getCurrencySymbol } from "@/lib/settings"

export default async function InvoicesPage() {
  await requirePermission("canViewSalesOrders")
  const currency = await getCurrencySymbol()

  const invoices = await prisma.invoice.findMany({
    orderBy: { createdAt: "desc" },
    include: { customer: true, salesOrder: true }
  })

  const getStatusBadge = (status: string) => {
    return status === "PAID" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
  }

  const getStatusText = (status: string) => {
    return status === "PAID" ? "مدفوعة" : "غير مدفوعة"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#061228]">الفواتير</h1>
          <p className="mt-1 text-sm text-gray-500">إدارة وطباعة فواتير المبيعات.</p>
        </div>
      </div>

      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto force-ltr">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">رقم الفاتورة</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">العميل</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ الإصدار</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الإجمالي</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{inv.invoiceNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inv.customer.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{inv.issueDate.toLocaleDateString('ar-EG')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{currency} {inv.total.toNumber().toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(inv.status)}`}>
                      {getStatusText(inv.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/invoices/${inv.id}`} className="text-[#dda322] hover:text-[#b8861b] p-1 rounded hover:bg-[#dda322]/10 transition" title="عرض وطباعة">
                        <Printer size={18} />
                      </Link>
                      {inv.status === "DRAFT" && <MarkInvoicePaidButton invoiceId={inv.id} />}
                    </div>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">لا توجد فواتير حالياً.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}