import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import { createSalesOrder } from "../actions"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default async function NewSalesOrderPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  await requirePermission("canCreateSalesOrders")
  const params = await searchParams
  const preselectedCustomerId = (params.customerId as string) || ""
  
  const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } })

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/sales-orders" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#dda322] transition mb-2">
          <ArrowRight size={16} /> العودة إلى أوامر البيع
        </Link>
        <h1 className="text-2xl font-bold text-[#061228]">إنشاء أمر بيع جديد</h1>
        <p className="mt-1 text-sm text-gray-500">أدخل تفاصيل العميل لإنشاء مسودة أمر بيع.</p>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <form action={createSalesOrder} className="space-y-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">اختر العميل *</label>
            <select name="customerId" required defaultValue={preselectedCustomerId} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition">
              <option value="">اختر عميلاً...</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.email ? `(${c.email})` : ""}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">ملاحظات (اختياري)</label>
            <textarea name="notes" rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" placeholder="مثال: عنوان التسليم، ملاحظات خاصة..." />
          </div>

          <div className="flex items-center justify-end gap-3 border-t pt-6">
            <Link href="/sales-orders" className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              إلغاء
            </Link>
            <button type="submit" className="rounded-lg bg-[#dda322] px-6 py-2 text-sm font-medium text-white hover:bg-[#b8861b] transition shadow-sm">
              إنشاء مسودة أمر بيع
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}