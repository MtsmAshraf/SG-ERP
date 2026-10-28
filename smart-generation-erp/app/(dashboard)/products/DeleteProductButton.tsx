"use client"

import { useState } from "react"
import { deleteProduct } from "./actions"
import { Trash2, X, AlertTriangle } from "lucide-react"
import { useActionState, useEffect } from "react"

// Wrapper action to catch errors and return them as state instead of crashing
async function deleteProductWithFeedback(prevState: any, formData: FormData) {
  try {
    await deleteProduct(formData)
    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message || "فشل حذف المنتج" }
  }
}

export function DeleteProductButton({ productId, productName }: { productId: string, productName: string }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(deleteProductWithFeedback, null)

  // Show browser alert if there's an error (e.g., product has relations)
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
      {/* Delete Icon Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="text-red-500 hover:text-red-700 transition-colors p-1 rounded hover:bg-red-50"
        title="حذف المنتج"
      >
        <Trash2 size={18} />
      </button>

      {/* Confirmation Modal */}
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
              هل أنت متأكد من حذف المنتج <span className="font-bold text-gray-900">"{productName}"</span>؟ 
              <br />لا يمكن التراجع عن هذا الإجراء.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isPending}
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                <X size={16} /> إلغاء
              </button>
              <form action={formAction}>
                <input type="hidden" name="productId" value={productId} />
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition disabled:opacity-50"
                >
                  {isPending ? "جاري الحذف..." : (
                    <>
                      <Trash2 size={16} /> نعم، احذف
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}