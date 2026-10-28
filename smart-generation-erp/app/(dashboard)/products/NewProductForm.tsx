"use client"

import { useActionState } from "react"
import { createProductWithFeedback } from "./actions"
import Link from "next/link"
import { Hash, Zap, Activity } from "lucide-react"

export default function NewProductForm() {
  const [state, formAction, isPending] = useActionState(createProductWithFeedback, null)

  return (
    <form action={formAction} className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
      {state?.error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200 flex items-center gap-2">
          <span>⚠️</span> {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* 1. Part Number (Formerly Name) */}
        <div className="md:col-span-2">
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700 flex items-center gap-1">
            <Hash size={14} className="text-gray-500" /> Part Number (رقم القطعة) *
          </label>
          <input id="name" name="name" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" placeholder="مثال: ATV320U40N4C" />
        </div>

        {/* 2. SKU & Category */}
        <div>
          <label htmlFor="sku" className="mb-1 block text-sm font-medium text-gray-700">رمز المنتج (SKU) *</label>
          <input id="sku" name="sku" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" placeholder="مثال: PRD-001" />
        </div>
        <div>
          <label htmlFor="category" className="mb-1 block text-sm font-medium text-gray-700">الفئة</label>
          <input id="category" name="category" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" placeholder="مثال: Inverter Drives" />
        </div>

        {/* 3. NEW: Power & Volt */}
        <div>
          <label htmlFor="power" className="mb-1 block text-sm font-medium text-gray-700 flex items-center gap-1">
            <Zap size={14} className="text-gray-500" /> Power (الطاقة) - kW
          </label>
          <input id="power" name="power" type="number" step="0.01" min="0" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" placeholder="مثال: 4.0" />
        </div>
        <div>
          <label htmlFor="volt" className="mb-1 block text-sm font-medium text-gray-700 flex items-center gap-1">
            <Activity size={14} className="text-gray-500" /> Volt (الجهد) - V
          </label>
          <input id="volt" name="volt" type="number" step="0.01" min="0" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" placeholder="مثال: 380" />
        </div>

        {/* 4. Unit & Stock */}
        <div>
          <label htmlFor="unit" className="mb-1 block text-sm font-medium text-gray-700">الوحدة *</label>
          <select id="unit" name="unit" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition">
            <option value="pcs">قطعة (pcs)</option>
            <option value="kg">كيلوجرام (kg)</option>
            <option value="box">صندوق (box)</option>
            <option value="meter">متر (meter)</option>
            <option value="set">طقم (set)</option>
          </select>
        </div>        
        <div>
          <label htmlFor="currentStock" className="mb-1 block text-sm font-medium text-gray-700">المخزون الحالي *</label>
          <input id="currentStock" name="currentStock" type="number" min="0" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
        </div>

        {/* 5. Prices (USD) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">سعر التكلفة (USD) *</label>
          <input name="costPriceUSD" type="number" step="0.01" min="0" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">سعر البيع (USD) *</label>
          <input name="sellPriceUSD" type="number" step="0.01" min="0" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
        </div>
      </div>

      {/* 6. Full Name and Specs */}
      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">Full Name and Specs (الاسم الكامل والمواصفات)</label>
        <textarea id="description" name="description" rows={4} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" placeholder="اكتب هنا الاسم التجاري الكامل، والمواصفات الفنية التفصيلية، وأي ملاحظات هامة..." />
      </div>

      <div className="flex items-center justify-end gap-3 border-t pt-6">
        <Link href="/products" className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">إلغاء</Link>
        <button type="submit" disabled={isPending} className="rounded-lg bg-[#dda322] px-6 py-2 text-sm font-medium text-white hover:bg-[#b8861b] transition shadow-sm disabled:opacity-50">
          {isPending ? "جاري الحفظ..." : "حفظ المنتج"}
        </button>
      </div>
    </form>
  )
}