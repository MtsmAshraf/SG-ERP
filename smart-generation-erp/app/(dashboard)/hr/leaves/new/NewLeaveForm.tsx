"use client"

import { useActionState } from "react"
import { createLeave } from "../actions"
import Link from "next/link"

interface Employee { id: string; firstName: string; lastName: string }

export default function NewLeaveForm({ employees }: { employees: Employee[] }) {
  const [state, formAction, isPending] = useActionState(createLeave, null)

  return (
    <form action={formAction} className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
      {state?.error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">⚠️ {state.error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label htmlFor="employeeId" className="mb-1 block text-sm font-medium text-gray-700">الموظف *</label>
          <select id="employeeId" name="employeeId" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition">
            <option value="">اختر موظفاً...</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.firstName} {e.lastName}</option>)}
          </select>
        </div>
        
        <div>
          <label htmlFor="type" className="mb-1 block text-sm font-medium text-gray-700">نوع الإجازة *</label>
          <select id="type" name="type" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition">
            <option value="ANNUAL">سنوية</option>
            <option value="SICK">مرضية</option>
            <option value="UNPAID">بدون راتب</option>
            <option value="EMERGENCY">طارئة</option>
          </select>
        </div>

        <div>
          <label htmlFor="startDate" className="mb-1 block text-sm font-medium text-gray-700">تاريخ البدء *</label>
          <input id="startDate" name="startDate" type="date" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="endDate" className="mb-1 block text-sm font-medium text-gray-700">تاريخ الانتهاء *</label>
          <input id="endDate" name="endDate" type="date" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="reason" className="mb-1 block text-sm font-medium text-gray-700">سبب الإجازة (اختياري)</label>
          <textarea id="reason" name="reason" rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t pt-6">
        <Link href="/hr/leaves" className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">إلغاء</Link>
        <button type="submit" disabled={isPending} className="rounded-lg bg-[#dda322] px-6 py-2 text-sm font-medium text-white hover:bg-[#b8861b] transition shadow-sm disabled:opacity-50">
          {isPending ? "جاري الحفظ..." : "إرسال الطلب"}
        </button>
      </div>
    </form>
  )
}