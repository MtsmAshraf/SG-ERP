"use client"

import { useActionState } from "react"
import { createCustody } from "../actions"
import Link from "next/link"

export default function NewCustodyForm({ products, employees }: { products: any[], employees: any[] }) {
  const [state, formAction, isPending] = useActionState(createCustody, null)

  return (
    <form action={formAction} className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
      {state?.error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">⚠️ {state.error}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">الموظف *</label>
          <select name="employeeId" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition">
            <option value="">اختر موظفاً...</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">المنتج *</label>
          <select name="productId" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition">
            <option value="">اختر منتجاً...</option>
            {products.map(p => <option key={p.id} value={p.id}>{p.name} (متوفر: {p.currentStock})</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">الكمية *</label>
          <input name="quantity" type="number" min="1" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">ملاحظات</label>
          <textarea name="notes" rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" placeholder="مثال: عهدة للمعرض الخارجي" />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t pt-6">
        <Link href="/custodies" className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">إلغاء</Link>
        <button type="submit" disabled={isPending} className="rounded-lg bg-[#dda322] px-6 py-2 text-sm font-medium text-white hover:bg-[#b8861b] transition shadow-sm disabled:opacity-50">
          {isPending ? "جاري الحفظ..." : "تسجيل العهدة"}
        </button>
      </div>
    </form>
  )
}