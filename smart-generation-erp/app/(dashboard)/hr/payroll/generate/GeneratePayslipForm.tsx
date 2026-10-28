"use client"

import { useActionState } from "react"
import { generatePayslip } from "../actions"
import Link from "next/link"

interface Employee { id: string; firstName: string; lastName: string; basicSalary: any }

export default function GeneratePayslipForm({ employees }: { employees: Employee[] }) {
  const [state, formAction, isPending] = useActionState(generatePayslip, null)

  // Get current month in YYYY-MM format for default value
  const currentMonth = new Date().toISOString().slice(0, 7)

  return (
    <form action={formAction} className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
      {state?.error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">️ {state.error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label htmlFor="employeeId" className="mb-1 block text-sm font-medium text-gray-700">الموظف *</label>
            <select id="employeeId" name="employeeId" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition">
            <option value="">اختر موظفاً...</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>
                {e.firstName} {e.lastName} - الراتب الأساسي: ${Number(e.basicSalary).toFixed(2)}
              </option>
            ))}
          </select>
        </div>
        
        <div className="md:col-span-2">
          <label htmlFor="month" className="mb-1 block text-sm font-medium text-gray-700">الشهر *</label>
          <input id="month" name="month" type="month" required defaultValue={currentMonth} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
        </div>

        <div>
          <label htmlFor="bonuses" className="mb-1 block text-sm font-medium text-gray-700">البدلات والمكافآت ($)</label>
          <input id="bonuses" name="bonuses" type="number" step="0.01" min="0" defaultValue="0" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
        </div>

        <div>
          <label htmlFor="deductions" className="mb-1 block text-sm font-medium text-gray-700">الخصومات والغياب ($)</label>
          <input id="deductions" name="deductions" type="number" step="0.01" min="0" defaultValue="0" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t pt-6">
        <Link href="/hr/payroll" className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">إلغاء</Link>
        <button type="submit" disabled={isPending} className="rounded-lg bg-[#dda322] px-6 py-2 text-sm font-medium text-white hover:bg-[#b8861b] transition shadow-sm disabled:opacity-50">
          {isPending ? "جاري الإنشاء..." : "إنشاء كشف الراتب"}
        </button>
      </div>
    </form>
  )
}