import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import { notFound } from "next/navigation"
import Link from "next/link"
import { updateSupplier } from "../../actions"

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("canEditSuppliers")
  const { id } = await params
  
  const supplier = await prisma.supplier.findUnique({ where: { id } })
  if (!supplier) notFound()

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href={`/suppliers/${id}`} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#dda322] transition mb-2">
          ← العودة إلى تفاصيل المورد
        </Link>
        <h1 className="text-2xl font-bold text-[#061228]">تعديل المورد</h1>
        <p className="mt-1 text-sm text-gray-500">تحديث بيانات المورد.</p>
      </div>

      <form action={updateSupplier} className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
        <input type="hidden" name="id" value={supplier.id} />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">اسم المورد *</label>
            <input id="name" name="name" required defaultValue={supplier.name} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">البريد الإلكتروني</label>
            <input id="email" name="email" type="email" defaultValue={supplier.email || ""} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
          </div>
          <div>
            <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">رقم الهاتف</label>
            <input id="phone" name="phone" defaultValue={supplier.phone || ""} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
          </div>
        </div>

        <div>
          <label htmlFor="address" className="mb-1 block text-sm font-medium text-gray-700">العنوان</label>
          <textarea id="address" name="address" rows={2} defaultValue={supplier.address || ""} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
        </div>

        <div className="flex items-center justify-end gap-3 border-t pt-6">
          <Link href={`/suppliers/${supplier.id}`} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">إلغاء</Link>
          <button type="submit" className="rounded-lg bg-[#dda322] px-6 py-2 text-sm font-medium text-white hover:bg-[#b8861b] transition shadow-sm">حفظ التعديلات</button>
        </div>
      </form>
    </div>
  )
}