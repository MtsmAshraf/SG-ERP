"use client"

import { useState } from "react"
import { deleteDepartment } from "./actions"
import { Trash2, X, AlertTriangle } from "lucide-react"
import { useActionState, useEffect } from "react"

async function deleteDepartmentWithFeedback(prevState: any, formData: FormData) {
  try {
    await deleteDepartment(formData)
    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message || "فشل حذف القسم" }
  }
}

export function DeleteDepartmentButton({ departmentId, departmentName, employeeCount }: { departmentId: string, departmentName: string, employeeCount: number }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(deleteDepartmentWithFeedback, null)

  useEffect(() => {
    if (state && !state.success && state.error) {
      alert(state.error)
      setIsModalOpen(false)
    } else if (state && state.success) {
      setIsModalOpen(false)
    }
  }, [state])

  return (
    <>
      <button onClick={() => setIsModalOpen(true)} className="text-red-500 hover:text-red-700 transition-colors p-1 rounded hover:bg-red-50" title="حذف القسم">
        <Trash2 size={18} />
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-[#061228]">تأكيد الحذف</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              هل أنت متأكد من حذف قسم <span className="font-bold text-gray-900">"{departmentName}"</span>؟
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} disabled={isPending} className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50">
                <X size={16} /> إلغاء
              </button>
              <form action={formAction}>
                <input type="hidden" name="departmentId" value={departmentId} />
                <button type="submit" disabled={isPending} className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition disabled:opacity-50">
                  {isPending ? "جاري الحذف..." : <><Trash2 size={16} /> نعم، احذف</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}