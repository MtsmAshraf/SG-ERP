"use client"

import { useActionState } from "react"
import { addOfferItem } from "./actions"  

export function AddOfferItemForm({ 
  offerId, 
  products,
  defaultPercentage = 0,
  usdRate = 50 
}: { 
  offerId: string
  products: any[]
  defaultPercentage?: number
  usdRate?: number
}) {
  const [state, formAction, isPending] = useActionState(addOfferItem, { error: null } as { error: string | null })

  return (
    <form action={formAction} className="rounded-lg border bg-white p-6 shadow-sm space-y-4">
      <h3 className="text-lg font-bold text-[#061228]">إضافة منتج للعرض</h3>
      
      {state?.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          ⚠️ {state.error}
        </div>
      )}

      <input type="hidden" name="offerId" value={offerId} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <label className="mb-1 block text-sm font-medium text-gray-700">المنتج *</label>
          <select name="productId" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]">
            <option value="">اختر منتجاً...</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({(p.sellPriceUSD * usdRate).toFixed(2)} EGP)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">الكمية *</label>
          <input name="quantity" type="number" min="1" step="1" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            النسبة (%) 
            <span className="text-xs text-gray-500 block">موجب = ربح، سالب = خصم</span>
          </label>
          <input name="percentage" type="number" step="0.01" defaultValue={defaultPercentage} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]" />
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={isPending} className="rounded-lg bg-[#dda322] px-6 py-2 text-sm font-medium text-white hover:bg-[#b8861b] transition shadow-sm disabled:opacity-50">
          {isPending ? "جاري الإضافة..." : "إضافة المنتج"}
        </button>
      </div>
    </form>
  )
}