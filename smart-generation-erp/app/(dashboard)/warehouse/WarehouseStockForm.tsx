"use client"

import { useState } from "react"
import { useActionState } from "react"
import { adjustProductStock, adjustCustomItemStock } from "./actions"
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react"

export function WarehouseStockForm({ 
  itemId, 
  itemName, 
  currentStock,
  type 
}: { 
  itemId: string
  itemName: string
  currentStock: number
  type: "product" | "custom"
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [actionType, setActionType] = useState<"IN" | "OUT">("IN")
  
  const action = type === "product" ? adjustProductStock : adjustCustomItemStock
  const [state, formAction, isPending] = useActionState(action, null)

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <button
          onClick={() => { setActionType("IN"); setIsOpen(true) }}
          className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 transition"
          title="إدخال مخزون"
        >
          <ArrowDownCircle size={18} />
        </button>
        <button
          onClick={() => { setActionType("OUT"); setIsOpen(true) }}
          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition"
          title="إخراج مخزون"
        >
          <ArrowUpCircle size={18} />
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-[#061228] mb-4">
              {actionType === "IN" ? "إدخال" : "إخراج"} مخزون
            </h3>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">البند:</p>
              <p className="font-semibold text-gray-900">{itemName}</p>
              <p className="text-xs text-gray-500 mt-1">الكمية الحالية: {currentStock}</p>
            </div>

            {state?.error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                ⚠️ {state.error}
              </div>
            )}

            <form action={formAction} className="space-y-4">
              <input type="hidden" name={type === "product" ? "productId" : "itemId"} value={itemId} />
              <input type="hidden" name="type" value={actionType} />
              
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">الكمية *</label>
                <input 
                  name="quantity" 
                  type="number" 
                  min="1" 
                  required 
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]" 
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">السبب / الملاحظات</label>
                <textarea 
                  name="reason" 
                  rows={2}
                  placeholder="مثال: تسليم لمشروع X، استلام من مورد Y..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]" 
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition shadow-sm disabled:opacity-50 ${
                    actionType === "IN" 
                      ? "bg-green-600 hover:bg-green-700" 
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {isPending ? "جاري التنفيذ..." : "تأكيد"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}