import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import Link from "next/link"

async function createCustomer(formData: FormData) {
  "use server"
  await prisma.customer.create({
    data: {
      name: formData.get("name") as string,
      email: formData.get("email") as string || null,
      phone: formData.get("phone") as string || null,
      address: formData.get("address") as string || null,
      salePercentage: parseFloat(formData.get("salePercentage") as string) || 0,
    },
  })
  redirect("/customers")
}

export default async function NewCustomerPage() {
  await requirePermission("canCreateCustomers") // ✅ Permission Check

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#061228]">إضافة عميل جديد</h1>
        <p className="mt-1 text-sm text-gray-500">أدخل بيانات العميل الجديد.</p>
      </div>

      <form action={createCustomer} className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">اسم العميل</label>
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
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">النسبة المئوية الافتراضية (%)</label>
            <input 
              name="defaultPercentage" 
              type="number" 
              step="0.01"
              defaultValue="0"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" 
            />
            <p className="mt-1 text-xs text-gray-500">
              قيمة موجبة = ربح إضافي، قيمة سالبة = خصم، صفر = سعر البيع العادي
            </p>
          </div>

        </div>

        <div>
          <label htmlFor="address" className="mb-1 block text-sm font-medium text-gray-700">العنوان</label>
          <textarea id="address" name="address" rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
        </div>

        <div className="flex items-center justify-end gap-3 border-t pt-6">
          <Link href="/customers" className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">إلغاء</Link>
          <button type="submit" className="rounded-lg bg-[#dda322] px-6 py-2 text-sm font-medium text-white hover:bg-[#b8861b] transition shadow-sm">حفظ العميل</button>
        </div>
      </form>
    </div>
  )
}