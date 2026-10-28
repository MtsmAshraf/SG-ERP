"use client"

import { useActionState } from "react"
import { addOrderItem } from "./actions"
import { Plus } from "lucide-react"

interface Product {
  id: string
  name: string
  sku: string
  currentStock: number
  costPrice: number
}

export function AddOrderItemForm({ salesOrderId, products }: { salesOrderId: string; products: Product[] }) {
  const [state, formAction, isPending] = useActionState(addOrderItem, { error: null })

  return (
    <div className="border-b bg-gray-50 p-4 rounded-lg mb-4">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="salesOrderId" value={salesOrderId} />
        
        {state.error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-800">{state.error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-6">
            <label className="mb-1 block text-sm font-medium text-gray-700">المنتج</label>
            <select name="productId" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition">
              <option value="">اختر منتجاً...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) - المخزون: {p.currentStock}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">الكمية</label>
            <input name="quantity" type="number" min="1" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
          </div>
          <div className="md:col-span-3">
            <label className="mb-1 block text-sm font-medium text-gray-700">سعر الوحدة *</label>
            <input name="unitPrice" type="number" step="0.01" min="0.01" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" placeholder="0.00" />
          </div>
          <div className="md:col-span-1">
            <button 
              type="submit" 
              disabled={isPending}
              className="w-full flex justify-center items-center gap-2 rounded-lg bg-[#dda322] px-4 py-2 text-sm font-medium text-white hover:bg-[#b8861b] transition disabled:opacity-50"
            >
              <Plus size={16} /> {isPending ? "جاري..." : "إضافة"}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}