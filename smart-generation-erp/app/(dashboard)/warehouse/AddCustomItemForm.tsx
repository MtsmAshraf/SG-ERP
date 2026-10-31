"use client"

import { useState } from "react"
import { useActionState } from "react"
import { createCustomWarehouseItem } from "./actions"
import { Plus } from "lucide-react"

export function AddCustomItemForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(createCustomWarehouseItem, null)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition shadow-sm"
      >
        <Plus size={16} /> إضافة بند مخصص
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-[#061228] mb-4">إضافة بند مخصص جديد</h3>

            {state?.error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                ⚠️ {state.error}
              </div>
            )}

            <form action={formAction} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">اسم البند *</label>
                <input 
                  name="name" 
                  type="text"
                  required 
                  placeholder="مثال: كابلات نحاسية 16mm"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]" 
                />
              </div>

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

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">الكمية الابتدائية</label>
                <input 
                  name="initialQuantity" 
                  type="number" 
                  min="0"
                  defaultValue="0"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]" 
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">ملاحظات</label>
                <textarea 
                  name="notes" 
                  rows={2}
                  placeholder="أي ملاحظات إضافية..."
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
                  className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition shadow-sm disabled:opacity-50"
                >
                  {isPending ? "جاري الحفظ..." : "حفظ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}