"use client"

import { useActionState } from "react"
import { addPOItem } from "./actions"

export function AddPOItemForm({ purchaseOrderId }: { purchaseOrderId: string }) {
  const [state, formAction, isPending] = useActionState(addPOItem, { error: null } as { error: string | null } | null)

  return (
    <form action={formAction} className="rounded-lg border bg-white p-6 shadow-sm space-y-4">
      <h3 className="text-lg font-bold text-[#061228]">إضافة بند لأمر الشراء</h3>
      
      {state?.error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          ⚠️ {state.error}
        </div>
      )}

      <input type="hidden" name="purchaseOrderId" value={purchaseOrderId} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* 1. Custom Item Name */}
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">اسم البند / المنتج *</label>
          <input 
            name="itemName" 
            type="text" 
            required 
            placeholder="مثال: كابلات نحاسية لمشروع X"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]" 
          />
        </div>

        {/* 2. Quantity */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">الكمية *</label>
          <input 
            name="quantity" 
            type="number" 
            min="1" 
            step="1"
            required 
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]" 
          />
        </div>

        {/* 3. Unit Selector */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">الوحدة *</label>
          <select 
            name="unit" 
            required 
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]"
          >
            <option value="pcs">قطعة (pcs)</option>
            <option value="kg">كيلوجرام (kg)</option>
            <option value="meter">متر (meter)</option>
            <option value="box">صندوق (box)</option>
            <option value="set">طقم (set)</option>
            <option value="roll">لفة (roll)</option>
          </select>
        </div>

        {/* 4. Unit Price in EGP */}
        <div className="md:col-span-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">سعر الوحدة (EGP) *</label>
          <input 
            name="unitCostEGP" 
            type="number" 
            step="0.01" 
            min="0"
            required 
            placeholder="0.00"
            className="w-full md:w-1/3 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]" 
          />
          <p className="mt-1 text-xs text-gray-500">
            أدخل السعر بالجنيه المصري كما هو متفق عليه مع المورد.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          type="submit" 
          disabled={isPending}
          className="rounded-lg bg-[#dda322] px-6 py-2 text-sm font-medium text-white hover:bg-[#b8861b] transition shadow-sm disabled:opacity-50"
        >
          {isPending ? "جاري الإضافة..." : "إضافة البند"}
        </button>
      </div>
    </form>
  )
}