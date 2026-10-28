"use client"

import { useState } from "react"
import { updateEmployee } from "@/app/(dashboard)/hr/employees/actions"; 
import Link from "next/link"

export default function EditEmployeeForm({ employee, departments }: { employee: any; departments: any[] }) {
  const [error, setError] = useState<string | null>(null)

  return (
    <form 
      action={async (formData) => {
        const result = await updateEmployee(null, formData)
        if (result?.error) setError(result.error)
      }}
      className="space-y-6 rounded-lg border bg-white p-6 shadow-sm"
    >
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          ⚠️ {error}
        </div>
      )}

      <input type="hidden" name="employeeId" value={employee.id} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">الاسم الأول *</label>
          <input name="firstName" defaultValue={employee.firstName} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">اسم العائلة *</label>
          <input name="lastName" defaultValue={employee.lastName} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">البريد الإلكتروني</label>
          <input name="email" type="email" defaultValue={employee.email || ""} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">رقم الهاتف</label>
          <input name="phone" defaultValue={employee.phone || ""} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">القسم</label>
          <select name="departmentId" defaultValue={employee.departmentId || ""} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition">
            <option value="">اختر قسماً...</option>
            {departments.map((dept: any) => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">المسمى الوظيفي</label>
          <input name="jobTitle" defaultValue={employee.jobTitle || ""} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">تاريخ التعيين</label>
          <input name="hireDate" type="date" defaultValue={employee.hireDate} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">الراتب الأساسي</label>
          <input name="basicSalary" type="number" step="0.01" min="0" defaultValue={employee.basicSalary} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">حالة الموظف</label>
          <select name="status" defaultValue={employee.status} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition">
            <option value="ACTIVE">نشط</option>
            <option value="ON_LEAVE">في إجازة</option>
            <option value="TERMINATED">منهي الخدمة</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t pt-6">
        <Link href={`/employees/${employee.id}`} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">إلغاء</Link>
        <button type="submit" className="rounded-lg bg-[#dda322] px-6 py-2 text-sm font-medium text-white hover:bg-[#b8861b] transition shadow-sm">
          حفظ التعديلات
        </button>
      </div>
    </form>
  )
}