import { requirePermission } from "@/lib/auth-utils"
import Link from "next/link"
import { createSupplier } from "../actions"

export default async function NewSupplierPage() {
  await requirePermission("canCreateSuppliers")

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/suppliers" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#dda322] transition mb-2">
          ← العودة إلى الموردين
        </Link>
        <h1 className="text-2xl font-bold text-[#061228]">إضافة مورد جديد</h1>
        <p className="mt-1 text-sm text-gray-500">أدخل بيانات المورد الجديد.</p>
      </div>

      <form action={createSupplier} className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">اسم المورد *</label>
            <input id="name" name="name" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">البريد الإلكتروني</label>
            <input id="email" name="email" type="email" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
          </div>
          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">رقم الهاتف</label>
            <input id="phone" name="phone" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
          </div>
        </div>

        <div>
          <label htmlFor="address" className="mb-1 block text-sm font-medium text-gray-700">العنوان</label>
          <textarea id="address" name="address" rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
        </div>

        <div className="flex items-center justify-end gap-3 border-t pt-6">
          <Link href="/suppliers" className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">إلغاء</Link>
          <button type="submit" className="rounded-lg bg-[#dda322] px-6 py-2 text-sm font-medium text-white hover:bg-[#b8861b] transition shadow-sm">حفظ المورد</button>
        </div>
      </form>
    </div>
  )
}