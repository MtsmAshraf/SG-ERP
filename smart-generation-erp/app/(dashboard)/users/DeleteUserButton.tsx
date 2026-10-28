"use client"

import { useState } from "react"
import { deactivateUser, reactivateUser } from "./actions"
import { Trash2, RotateCcw, X, AlertTriangle, CheckCircle2 } from "lucide-react"
import { useActionState, useEffect } from "react"

async function handleUserAction(isActive: boolean, prevState: any, formData: FormData) {
  try {
    if (isActive) {
      await deactivateUser(prevState, formData)
    } else {
      await reactivateUser(prevState, formData)
    }
    return { success: true, error: null, message: isActive ? "تم تعطيل المستخدم بنجاح." : "تم إعادة التفعيل بنجاح." }
  } catch (error: any) {
    return { success: false, error: error.message || "فشلت العملية", message: null }
  }
}

export function UserActionButton({ userId, userName, isActive }: { userId: string, userName: string, isActive: boolean }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Bind the action based on current state
  const actionHandler = async (prevState: any, formData: FormData) => {
    return await handleUserAction(isActive, prevState, formData)
  }
  
  const [state, formAction, isPending] = useActionState(actionHandler, null)

  useEffect(() => {
    if (state?.success) {
      setIsModalOpen(false)
    }
  }, [state])

  const isDeactivating = isActive

  return (
    <>
      {/* Trigger Button */}
      <button 
        onClick={() => setIsModalOpen(true)} 
        className={`p-1 rounded transition ${
          isDeactivating 
            ? "text-red-500 hover:text-red-700 hover:bg-red-50" 
            : "text-green-600 hover:text-green-800 hover:bg-green-50"
        }`}
        title={isDeactivating ? "تعطيل المستخدم" : "إعادة تفعيل المستخدم"}
      >
        {isDeactivating ? <Trash2 size={18} /> : <RotateCcw size={18} />}
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isDeactivating ? "bg-red-100" : "bg-green-100"}`}>
                {isDeactivating ? (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                )}
              </div>
              <h3 className="text-lg font-bold text-[#061228]">
                {isDeactivating ? "تأكيد التعطيل" : "تأكيد إعادة التفعيل"}
              </h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-6">
              {isDeactivating ? (
                <>
                  هل أنت متأكد من تعطيل المستخدم <span className="font-bold text-gray-900">"{userName}"</span>؟ <br />
                  لن يتمكن من تسجيل الدخول، لكن ستظل سجلاته محفوظة.
                </>
              ) : (
                <>
                  هل تريد إعادة تفعيل المستخدم <span className="font-bold text-gray-900">"{userName}"</span>؟ <br />
                  سيتمكن من تسجيل الدخول والوصول إلى النظام مجدداً.
                </>
              )}
            </p>
            
            {state?.error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200 flex items-center gap-2">
                <AlertTriangle size={16} /> {state.error}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)} 
                disabled={isPending} 
                className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              >
                <X size={16} /> إلغاء
              </button>
              <form action={formAction}>
                <input type="hidden" name="userId" value={userId} />
                <button 
                  type="submit" 
                  disabled={isPending} 
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition disabled:opacity-50 ${
                    isDeactivating ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {isPending ? "جاري المعالجة..." : (
                    <>
                      {isDeactivating ? <Trash2 size={16} /> : <RotateCcw size={16} />}
                      {isDeactivating ? "نعم، عطّل" : "نعم، فعّل"}
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