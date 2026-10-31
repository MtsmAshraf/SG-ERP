import { prisma } from "@/lib/prisma"
import { requirePermission, getUserPermissions } from "@/lib/auth-utils"
import { notFound } from "next/navigation"
import Link from "next/link"
import { 
  ArrowRight, Wrench, Package, Users, Calendar, 
  FileText, CheckCircle, XCircle, Clock, AlertCircle,
  Barcode, DollarSign
} from "lucide-react"
import { updateMaintenanceStatus, returnToCustomer } from "../actions"

export default async function MaintenanceDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  await requirePermission("canViewMaintenance")
  const permissions = await getUserPermissions()
  const { id } = await params

  const maintenance = await prisma.maintenance.findUnique({
    where: { id },
    include: {
      customer: true,
      salesOrder: { select: { orderNumber: true } },
      createdBy: { select: { name: true } },
      items: {
        include: {
          product: true,
          serialNumber: true
        }
      }
    }
  })

  if (!maintenance) notFound()

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string; icon: any }> = {
      RECEIVED: { label: "تم الاستلام", className: "bg-blue-100 text-blue-800", icon: Clock },
      UNDER_REPAIR: { label: "قيد الإصلاح", className: "bg-yellow-100 text-yellow-800", icon: Wrench },
      WAITING_PARTS: { label: "بانتظار قطع الغيار", className: "bg-orange-100 text-orange-800", icon: AlertCircle },
      COMPLETED: { label: "مكتمل", className: "bg-green-100 text-green-800", icon: CheckCircle },
      RETURNED: { label: "تم الإرجاع", className: "bg-gray-100 text-gray-800", icon: CheckCircle },
      SCRAPPED: { label: "تم الإتلاف", className: "bg-red-100 text-red-800", icon: XCircle }
    }
    const badge = badges[status] || badges.RECEIVED
    const Icon = badge.icon
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${badge.className}`}>
        <Icon size={14} />
        {badge.label}
      </span>
    )
  }

  const canUpdateStatus = permissions?.canManageMaintenance && maintenance.status !== "RETURNED" && maintenance.status !== "SCRAPPED"
  const canReturn = permissions?.canManageMaintenance && maintenance.status === "COMPLETED"

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <Link href="/maintenance" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#dda322] transition mb-2">
          <ArrowRight size={16} /> العودة إلى الصيانة
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#dda322]/10">
              <Wrench className="text-[#dda322]" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#061228] font-mono">{maintenance.maintenanceNumber}</h1>
              <div className="mt-1">
                {getStatusBadge(maintenance.status)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Users size={16} className="text-blue-600" />
            <span>العميل</span>
          </div>
          <p className="text-lg font-bold text-[#061228]">
            {maintenance.customer?.name || "غير محدد"}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Calendar size={16} className="text-green-600" />
            <span>تاريخ الاستلام</span>
          </div>
          <p className="text-lg font-bold text-[#061228]">
            {maintenance.receivedDate.toLocaleDateString("ar-EG")}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <FileText size={16} className="text-purple-600" />
            <span>أمر البيع الأصلي</span>
          </div>
          <p className="text-lg font-bold text-[#061228]">
            {maintenance.salesOrder?.orderNumber || "—"}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <DollarSign size={16} className="text-orange-600" />
            <span>تكلفة الإصلاح</span>
          </div>
          <p className="text-lg font-bold text-[#061228]">
            {maintenance.repairCost ? `${maintenance.repairCost.toNumber().toFixed(2)} EGP` : "—"}
          </p>
        </div>
      </div>

      {/* Products Being Repaired */}
      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <div className="border-b bg-gray-50 px-6 py-4">
          <h2 className="text-lg font-bold text-[#061228] flex items-center gap-2">
            <Package size={20} className="text-[#dda322]" />
            المنتجات قيد الصيانة
          </h2>
        </div>
        <div className="overflow-x-auto force-ltr">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">المنتج</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">الرقم التسلسلي (SN)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">الكمية</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">المشكلة</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">الحالة</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {maintenance.items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm">
                    <Link href={`/products/${item.product.id}`} className="font-medium text-gray-900 hover:text-[#dda322]">
                      {item.product.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono font-bold text-gray-900">
                    {item.serialNumber ? (
                      <span className="inline-flex items-center gap-1">
                        <Barcode size={14} className="text-gray-400" />
                        {item.serialNumber.serialNumber}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">غير محدد</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.quantity}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">{item.issueDescription}</td>
                  <td className="px-6 py-4 text-sm">
                    {getStatusBadge(item.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes & Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-500 mb-3">ملاحظات الاستلام</h3>
          <p className="text-gray-700 whitespace-pre-wrap">
            {maintenance.notes || "لا توجد ملاحظات"}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-500 mb-3">ملاحظات الإصلاح</h3>
          <p className="text-gray-700 whitespace-pre-wrap">
            {maintenance.repairNotes || "لم تُضاف بعد"}
          </p>
        </div>
      </div>

      {/* Actions Section */}
      {canUpdateStatus && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#061228] mb-4">تحديث الحالة</h2>
          <form action={updateMaintenanceStatus} className="space-y-4">
            <input type="hidden" name="maintenanceId" value={maintenance.id} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">الحالة الجديدة</label>
                <select name="status" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]">
                  <option value="RECEIVED">تم الاستلام</option>
                  <option value="UNDER_REPAIR">قيد الإصلاح</option>
                  <option value="WAITING_PARTS">بانتظار قطع الغيار</option>
                  <option value="COMPLETED">مكتمل</option>
                  <option value="SCRAPPED">تم الإتلاف</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">تكلفة الإصلاح (EGP)</label>
                <input name="repairCost" type="number" step="0.01" min="0" defaultValue={maintenance.repairCost?.toNumber() || ""} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]" />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">ملاحظات الإصلاح</label>
                <textarea name="repairNotes" rows={3} defaultValue={maintenance.repairNotes || ""} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]" />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" className="rounded-lg bg-[#dda322] px-6 py-2 text-sm font-medium text-white hover:bg-[#b8861b] transition shadow-sm">
                حفظ التحديث
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Return to Customer Button */}
      {canReturn && (
        <div className="rounded-lg border-2 border-green-200 bg-green-50 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-green-800 mb-2 flex items-center gap-2">
            <CheckCircle size={20} />
            جاهز للإرجاع للعميل
          </h2>
          <p className="text-sm text-green-700 mb-4">
            تم إكمال الإصلاح. اضغط على الزر أدناه لتسجيل إرجاع المنتج للعميل.
          </p>
          <form action={returnToCustomer}>
            <input type="hidden" name="maintenanceId" value={maintenance.id} />
            <button type="submit" className="rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 transition shadow-sm">
              ✓ تسجيل الإرجاع للعميل
            </button>
          </form>
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-gray-500 border-t pt-4">
        <p>تم الإنشاء بواسطة: {maintenance.createdBy?.name || "النظام"} • {maintenance.createdAt.toLocaleDateString("ar-EG")}</p>
        {maintenance.returnedDate && <p>تاريخ الإرجاع: {maintenance.returnedDate.toLocaleDateString("ar-EG")}</p>}
      </div>
    </div>
  )
}