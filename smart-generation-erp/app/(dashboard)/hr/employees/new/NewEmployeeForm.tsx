"use client"

import { useActionState } from "react"
import { createEmployee } from "../actions"
import Link from "next/link"

interface Department { id: string; name: string }

export default function NewEmployeeForm({ departments }: { departments: Department[] }) {
  const [state, formAction, isPending] = useActionState(createEmployee, null)

  return (
    <form action={formAction} className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
      {state?.error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">⚠️ {state.error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-gray-700">الاسم الأول *</label>
          <input id="firstName" name="firstName" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
        </div>
        <div>
          <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-gray-700">اسم العائلة *</label>
          <input id="lastName" name="lastName" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">البريد الإلكتروني</label>
          <input id="email" name="email" type="email" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
        </div>
        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">رقم الهاتف</label>
          <input id="phone" name="phone" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
        </div>
        <div>
          <label htmlFor="jobTitle" className="mb-1 block text-sm font-medium text-gray-700">المسمى الوظيفي *</label>
          <input id="jobTitle" name="jobTitle" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" placeholder="مثال: مطور برمجيات" />
        </div>
        <div>
          <label htmlFor="departmentId" className="mb-1 block text-sm font-medium text-gray-700">القسم</label>
          <select id="departmentId" name="departmentId" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition">
            <option value="">اختر قسماً...</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="hireDate" className="mb-1 block text-sm font-medium text-gray-700">تاريخ التعيين *</label>
          <input id="hireDate" name="hireDate" type="date" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
        </div>
        <div>
          <label htmlFor="basicSalary" className="mb-1 block text-sm font-medium text-gray-700">الراتب الأساسي *</label>
          <input id="basicSalary" name="basicSalary" type="number" step="0.01" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" placeholder="0.00" />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t pt-6">
        <Link href="/hr/employees" className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">إلغاء</Link>
        <button type="submit" disabled={isPending} className="rounded-lg bg-[#dda322] px-6 py-2 text-sm font-medium text-white hover:bg-[#b8861b] transition shadow-sm disabled:opacity-50">
          {isPending ? "جاري الحفظ..." : "حفظ بيانات الموظف"}
        </button>
      </div>
    </form>
  )
}