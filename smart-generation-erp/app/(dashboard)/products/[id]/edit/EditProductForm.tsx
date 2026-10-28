"use client"

import { useActionState } from "react"
import { updateProduct } from "../../actions" 
import Link from "next/link"
import { ArrowRight, Hash, Zap, Activity } from "lucide-react"

export default function EditProductForm({ product }: { product: any }) {
  const [state, formAction, isPending] = useActionState(updateProduct, null)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href={`/products/${product.id}`} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#dda322] transition mb-2">
          <ArrowRight size={16} /> العودة إلى تفاصيل المنتج
        </Link>
        <h1 className="text-2xl font-bold text-[#061228]">تعديل المنتج</h1>
        <p className="mt-1 text-sm text-gray-500">تحديث بيانات ومواصفات المنتج.</p>
      </div>

      <form action={formAction} className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
        {state?.error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
            ⚠️ {state.error}
          </div>
        )}
        
        <input type="hidden" name="productId" value={product.id} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 1. Part Number (Previously Name) */}
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700 flex items-center gap-1">
              <Hash size={14} className="text-gray-500" /> Part Number (رقم القطعة) *
            </label>
            <input 
              name="name" 
              defaultValue={product.name} 
              required 
              placeholder="مثال: ATV320U40N4C"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" 
            />
          </div>
          
          {/* 2. SKU & Category */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">رمز المنتج (SKU) *</label>
            <input 
              name="sku" 
              defaultValue={product.sku} 
              required 
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" 
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">الفئة</label>
            <input 
              name="category" 
              defaultValue={product.category || ""} 
              placeholder="مثال: Inverter Drives"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" 
            />
          </div>

          {/* 3. NEW: Power & Volt */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 flex items-center gap-1">
              <Zap size={14} className="text-gray-500" /> Power (الطاقة) - kW
            </label>
            <input 
              name="power" 
              type="number" 
              step="0.01" 
              min="0" 
              defaultValue={product.power || ""} 
              placeholder="مثال: 4.0"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" 
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 flex items-center gap-1">
              <Activity size={14} className="text-gray-500" /> Volt (الجهد) - V
            </label>
            <input 
              name="volt" 
              type="number" 
              step="0.01" 
              min="0" 
              defaultValue={product.volt || ""} 
              placeholder="مثال: 380"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" 
            />
          </div>

          {/* 4. Unit & Stock */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">الوحدة *</label>
            <select 
              name="unit" 
              defaultValue={product.unit || "pcs"} 
              required 
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition"
            >
              <option value="pcs">قطعة (pcs)</option>
              <option value="kg">كيلوجرام (kg)</option>
              <option value="box">صندوق (box)</option>
              <option value="meter">متر (meter)</option>
              <option value="set">طقم (set)</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">المخزون الحالي *</label>
            <input 
              name="currentStock" 
              type="number" 
              min="0" 
              defaultValue={product.currentStock} 
              required 
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" 
            />
          </div>

          {/* 5. Prices (USD) */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">سعر التكلفة (USD) *</label>
            <input 
              name="costPriceUSD" 
              type="number" 
              step="0.01" 
              min="0" 
              defaultValue={product.costPriceUSD} 
              required 
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" 
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">سعر البيع (USD) *</label>
            <input 
              name="sellPriceUSD" 
              type="number" 
              step="0.01" 
              min="0" 
              defaultValue={product.sellPriceUSD} 
              required 
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" 
            />
          </div>

          {/* 6. NEW Label: Full Name and Specs */}
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">Full Name and Specs (الاسم الكامل والمواصفات)</label>
            <textarea 
              name="description" 
              defaultValue={product.description || ""} 
              rows={4} 
              placeholder="اكتب هنا الاسم التجاري الكامل، والمواصفات الفنية التفصيلية، وأي ملاحظات هامة..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" 
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t pt-6">
          <Link href={`/products/${product.id}`} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
            إلغاء
          </Link>
          <button 
            type="submit" 
            disabled={isPending} 
            className="rounded-lg bg-[#dda322] px-6 py-2 text-sm font-medium text-white hover:bg-[#b8861b] transition shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
          </button>
        </div>
      </form>
    </div>
  )
}