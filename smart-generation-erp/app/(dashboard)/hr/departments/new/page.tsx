"use client"

import { useActionState } from "react"
import { createDepartment } from "../actions"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function NewDepartmentPage() {
  const [state, formAction, isPending] = useActionState(createDepartment, null)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/hr/departments" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#dda322] transition mb-2">
          <ArrowRight size={16} /> العودة إلى الأقسام
        </Link>
        <h1 className="text-2xl font-bold text-[#061228]">إضافة قسم جديد</h1>
        <p className="mt-1 text-sm text-gray-500">أدخل اسم القسم الجديد لإضافته إلى هيكل الشركة.</p>
      </div>

      <form action={formAction} className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
        {state?.error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">⚠️ {state.error}</div>
        )}

        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">اسم القسم *</label>
          <input id="name" name="name" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" placeholder="مثال: الموارد البشرية، المبيعات، التقنية" />
        </div>

        <div className="flex items-center justify-end gap-3 border-t pt-6">
          <Link href="/hr/departments" className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">إلغاء</Link>
          <button type="submit" disabled={isPending} className="rounded-lg bg-[#dda322] px-6 py-2 text-sm font-medium text-white hover:bg-[#b8861b] transition shadow-sm disabled:opacity-50">
            {isPending ? "جاري الحفظ..." : "حفظ القسم"}
          </button>
        </div>
      </form>
    </div>
  )
}