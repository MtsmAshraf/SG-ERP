"use client"

import { useState } from "react"
import { useActionState } from "react"
import { returnFromDeposit, returnFromCustody } from "./actions"
import { ArrowUpCircle } from "lucide-react"

export function ReturnToWarehouseButton({
  type,
  itemId,
  productId,
  itemName,
  locationName,
  currentQuantity,
  unit
}: {
  type: "deposit" | "custody"
  itemId: string
  productId: string
  itemName: string
  locationName: string
  currentQuantity: number
  unit: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  
  const action = type === "deposit" ? returnFromDeposit : returnFromCustody
  const [state, formAction, isPending] = useActionState(action, null)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-800 p-1 rounded hover:bg-orange-50 transition"
        title="إرجاع للمخزن الرئيسي"
      >
        <ArrowUpCircle size={18} />
        <span className="text-xs font-medium">إرجاع</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-[#061228] mb-4">
              إرجاع إلى المخزن الرئيسي
            </h3>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-lg space-y-1">
              <p className="text-sm text-gray-600">المنتج:</p>
              <p className="font-semibold text-gray-900">{itemName}</p>
              <p className="text-sm text-gray-600 mt-2">الموقع الحالي:</p>
              <p className="font-semibold text-gray-900">{locationName}</p>
              <p className="text-xs text-gray-500 mt-2">الكمية المتاحة: {currentQuantity} {unit}</p>
            </div>

            {state?.error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                ⚠️ {state.error}
              </div>
            )}

            <form action={formAction} className="space-y-4">
              <input type="hidden" name={type === "deposit" ? "depositItemId" : "custodyItemId"} value={itemId} />
              <input type="hidden" name="productId" value={productId} />
              
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">الكمية المراد إرجاعها *</label>
                <input 
                  name="quantity" 
                  type="number" 
                  min="1" 
                  max={currentQuantity}
                  required 
                  defaultValue={currentQuantity}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]" 
                />
                <p className="mt-1 text-xs text-gray-500">الحد الأقصى: {currentQuantity} {unit}</p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">السبب / الملاحظات</label>
                <textarea 
                  name="reason" 
                  rows={2}
                  placeholder="مثال: انتهاء المشروع، إرجاع مؤقت..."
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
                  className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 transition shadow-sm disabled:opacity-50"
                >
                  {isPending ? "جاري الإرجاع..." : "تأكيد الإرجاع"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}