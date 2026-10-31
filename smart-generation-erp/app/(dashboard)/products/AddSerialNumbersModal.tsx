"use client"

import { useState, useEffect } from "react"
import { useActionState } from "react"
import { addSerialNumbers } from "./actions"
import { X, Barcode, AlertCircle } from "lucide-react"

export function AddSerialNumbersModal({ productId }: { productId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [fromSN, setFromSN] = useState("")
  const [toSN, setToSN] = useState("")
  const [calculatedQty, setCalculatedQty] = useState(0)
  
  const [state, formAction, isPending] = useActionState(addSerialNumbers, null)

  // Auto-calculate quantity when SNs change
  useEffect(() => {
    const start = parseInt(fromSN, 10)
    const end = parseInt(toSN, 10)
    if (!isNaN(start) && !isNaN(end) && start <= end) {
      setCalculatedQty(end - start + 1)
    } else {
      setCalculatedQty(0)
    }
  }, [fromSN, toSN])

  // Reset form on success
  useEffect(() => {
    if (state?.success) {
      setIsOpen(false)
      setFromSN("")
      setToSN("")
      setCalculatedQty(0)
    }
  }, [state])

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-[#061228] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a1f3d] transition shadow-sm"
      >
        <Barcode size={16} />
        إضافة أرقام تسلسلية
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#061228]">إضافة نطاق أرقام تسلسلية</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {state?.error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{state.error}</span>
              </div>
            )}

            <form action={formAction} className="space-y-4">
              <input type="hidden" name="productId" value={productId} />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">من رقم تسلسلي *</label>
                  <input 
                    name="fromSN"
                    value={fromSN}
                    onChange={(e) => setFromSN(e.target.value)}
                    placeholder="مثال: 98743511"
                    required 
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]" 
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">إلى رقم تسلسلي *</label>
                  <input 
                    name="toSN"
                    value={toSN}
                    onChange={(e) => setToSN(e.target.value)}
                    placeholder="مثال: 98743520"
                    required 
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]" 
                  />
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">الكمية المراد إضافتها:</span>
                <span className="text-xl font-bold text-blue-900">
                  {calculatedQty > 0 ? calculatedQty : "—"}
                </span>
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
                  disabled={isPending || calculatedQty === 0}
                  className="rounded-lg bg-[#dda322] px-4 py-2 text-sm font-medium text-white hover:bg-[#b8861b] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? "جاري الحفظ..." : "حفظ الأرقام التسلسلية"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}