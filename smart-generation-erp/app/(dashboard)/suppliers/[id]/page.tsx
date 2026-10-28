import { prisma } from "@/lib/prisma"
import { requirePermission, getUserPermissions } from "@/lib/auth-utils"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Mail, Phone, MapPin, ShoppingCart, Pencil, Eye } from "lucide-react"

export default async function SupplierDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("canViewSuppliers")
  const permissions = await getUserPermissions()
  const { id } = await params

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      purchaseOrders: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  })

  if (!supplier) notFound()

  const totalSpent = supplier.purchaseOrders
    .filter(po => po.status === "CONFIRMED")
    .reduce((sum, po) => sum + po.total.toNumber(), 0)

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Link href="/suppliers" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#dda322] transition mb-2">
          ← العودة إلى الموردين
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#061228]">{supplier.name}</h1>
          {permissions?.canEditSuppliers && (
            <Link
              href={`/suppliers/${supplier.id}/edit`}
              className="inline-flex items-center gap-2 rounded-lg bg-[#dda322] px-4 py-2 text-sm font-medium text-white hover:bg-[#b8861b] transition shadow-sm"
            >
              <Pencil size={16} /> تعديل المورد
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Mail size={16} className="text-[#dda322]" />
            <span>البريد الإلكتروني</span>
          </div>
          <p className="mt-1 text-base font-semibold text-gray-900 break-all" dir="ltr">
            {supplier.email || "—"}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Phone size={16} className="text-[#dda322]" />
            <span>رقم الهاتف</span>
          </div>
          {supplier.phone ? (
            <a href={`tel:${supplier.phone}`} className="mt-1 text-base font-semibold text-gray-900 hover:text-[#dda322] transition" dir="ltr">
              {supplier.phone}
            </a>
          ) : (
            <p className="mt-1 text-base font-semibold text-gray-400">—</p>
          )}
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">إجمالي المشتريات (المؤكدة)</p>
          <p className="mt-1 text-2xl font-bold text-[#dda322]">{totalSpent.toFixed(2)} EGP</p>
          <p className="text-xs text-gray-500 mt-1">{supplier.purchaseOrders.length} أمر/أوامر شراء</p>
        </div>
      </div>

      {supplier.address && (
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <MapPin size={16} className="text-[#dda322]" />
            <span>العنوان</span>
          </div>
          <p className="text-gray-900 whitespace-pre-line">{supplier.address}</p>
        </div>
      )}

      <section className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <ShoppingCart size={20} className="text-[#061228]" />
            <h2 className="text-lg font-bold text-[#061228]">أوامر الشراء</h2>
          </div>
          <Link
            href={`/purchase-orders/new?supplierId=${supplier.id}`}
            className="rounded-lg bg-[#dda322] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#b8861b] transition shadow-sm"
          >
            + أمر شراء جديد
          </Link>
        </div>
        
        {/* ✅ 100% Responsive Table Wrapper */}
        <div className="overflow-x-auto force-ltr">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">رقم الأمر</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الإجمالي</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {supplier.purchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                    لا توجد أوامر شراء لهذا المورد بعد.
                  </td>
                </tr>
              ) : (
                supplier.purchaseOrders.map((po) => {
                  const statusColors: Record<string, string> = {
                    DRAFT: "bg-gray-100 text-gray-800",
                    PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
                    APPROVED: "bg-blue-100 text-blue-800",
                    REJECTED: "bg-red-100 text-red-800",
                    CONFIRMED: "bg-green-100 text-green-800",
                  }
                  const statusLabels: Record<string, string> = {
                    DRAFT: "مسودة",
                    PENDING_APPROVAL: "قيد الاعتماد",
                    APPROVED: "معتمد",
                    REJECTED: "مرفوض",
                    CONFIRMED: "مؤكد",
                  }

                  return (
                    <tr key={po.id} className="hover:bg-gray-50 transition">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-gray-900">{po.poNumber}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{po.createdAt.toLocaleDateString('ar-EG')}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{po.total.toNumber().toFixed(2)} EGP</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusColors[po.status] || "bg-gray-100 text-gray-800"}`}>
                          {statusLabels[po.status] || po.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                        <Link href={`/purchase-orders/${po.id}`} className="inline-flex items-center gap-1 text-[#061228] hover:text-[#dda322] transition font-medium">
                          <Eye size={16} /> عرض
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}