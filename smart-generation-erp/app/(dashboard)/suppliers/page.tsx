import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import Link from "next/link"
import { Pencil, Eye } from "lucide-react"
import { DeleteSupplierButton } from "./DeleteSupplierButton"

export default async function SuppliersPage() {
  await requirePermission("canViewSuppliers")
  const suppliers = await prisma.supplier.findMany({ orderBy: { createdAt: "desc" } })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#061228]">الموردين</h1>
          <p className="mt-1 text-sm text-gray-500">إدارة بيانات الموردين.</p>
        </div>
        <Link href="/suppliers/new" className="inline-flex justify-center items-center px-4 py-2 bg-[#dda322] text-white rounded-lg hover:bg-[#b8861b] transition font-medium shadow-sm">
          + إضافة مورد جديد
        </Link>
      </div>

      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto force-ltr">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الاسم</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">البريد الإلكتروني</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الهاتف</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {suppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{supplier.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.email || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{supplier.phone || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/suppliers/${supplier.id}`} className="text-[#061228] hover:text-[#dda322] p-1 rounded hover:bg-gray-100 transition" title="عرض التفاصيل">
                        <Eye size={18} />
                      </Link>
                      <Link href={`/suppliers/${supplier.id}/edit`} className="text-[#dda322] hover:text-[#b8861b] p-1 rounded hover:bg-[#dda322]/10 transition" title="تعديل">
                        <Pencil size={18} />
                      </Link>
                      <DeleteSupplierButton supplierId={supplier.id} supplierName={supplier.name} />
                    </div>
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">لا يوجد موردون حالياً.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}