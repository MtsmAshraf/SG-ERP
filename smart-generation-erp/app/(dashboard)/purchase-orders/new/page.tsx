import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import { createPurchaseOrder } from "../actions"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default async function NewPurchaseOrderPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  await requirePermission("canCreatePurchaseOrders")
  const params = await searchParams
  const preselectedSupplierId = (params.supplierId as string) || ""
  
  const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" } })

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/purchase-orders" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#dda322] transition mb-2">
          <ArrowRight size={16} /> العودة إلى أوامر الشراء
        </Link>
        <h1 className="text-2xl font-bold text-[#061228]">إنشاء أمر شراء جديد</h1>
        <p className="mt-1 text-sm text-gray-500">أدخل تفاصيل المورد لإنشاء مسودة أمر شراء.</p>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <form action={createPurchaseOrder} className="space-y-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">اختر المورد *</label>
            <select name="supplierId" required defaultValue={preselectedSupplierId} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition">
              <option value="">اختر مورداً...</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name} {s.email ? `(${s.email})` : ""}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">ملاحظات (اختياري)</label>
            <textarea name="notes" rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" placeholder="مثال: تاريخ التسليم المتوقع، تعليمات خاصة..." />
          </div>

          <div className="flex items-center justify-end gap-3 border-t pt-6">
            <Link href="/purchase-orders" className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              إلغاء
            </Link>
            <button type="submit" className="rounded-lg bg-[#dda322] px-6 py-2 text-sm font-medium text-white hover:bg-[#b8861b] transition shadow-sm">
              إنشاء مسودة أمر شراء
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}