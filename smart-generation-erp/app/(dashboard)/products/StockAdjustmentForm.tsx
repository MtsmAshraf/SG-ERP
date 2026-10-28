"use client"

import { useActionState } from "react"
import { adjustStock } from "./actions"

export function StockAdjustmentForm({ productId }: { productId: string }) {
  const [state, formAction, isPending] = useActionState(adjustStock, { error: "" })

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="productId" value={productId} />
        
        {state.error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-800">{state.error}</p>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Movement Type</label>
          <select name="type" className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500">
            <option value="STOCK_IN">Stock In (Purchase/Return)</option>
            <option value="STOCK_OUT">Stock Out (Damage/Loss)</option>
            <option value="ADJUSTMENT">Inventory Adjustment</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Quantity</label>
          <input name="quantity" type="number" min="1" required className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Reason</label>
          <input name="reason" required className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="e.g. Quarterly audit" />
        </div>

        <button 
          type="submit" 
          disabled={isPending}
          className="w-full rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {isPending ? "Applying..." : "Apply Adjustment"}
        </button>
      </form>
    </div>
  )
}