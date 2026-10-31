import { prisma } from "@/lib/prisma"
import { requirePermission, getUserPermissions } from "@/lib/auth-utils"
import { Prisma } from "@prisma/client"
import Link from "next/link"
import { 
  Wrench, Search, Eye, Plus, Clock, CheckCircle, 
  XCircle, AlertCircle, Package, Users 
} from "lucide-react"
import { Pagination } from "@/components/Pagination"
import { PAGE_SIZE } from "@/lib/pagination"

export default async function MaintenancePage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await requirePermission("canViewMaintenance")
  const permissions = await getUserPermissions()

  const params = await searchParams
  const currentPage = Number(params.page) || 1
  const searchQuery = (params.search as string) || ""
  const statusFilter = (params.status as string) || ""

  const where: Prisma.MaintenanceWhereInput = {
    ...(searchQuery && {
      OR: [
        { maintenanceNumber: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } },
        { customer: { name: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } } },
        { notes: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } }
      ]
    }),
    ...(statusFilter && { status: statusFilter as any })
  }

  const [maintenances, totalItems] = await Promise.all([
    prisma.maintenance.findMany({
      where,
      orderBy: { receivedDate: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        customer: { select: { name: true } },
        items: { include: { product: { select: { name: true } } } },
        createdBy: { select: { name: true } }
      }
    }),
    prisma.maintenance.count({ where })
  ])

  // Stats
  const stats = await prisma.maintenance.groupBy({
    by: ["status"],
    _count: true
  })

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
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}>
        <Icon size={12} />
        {badge.label}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#061228] flex items-center gap-2">
            <Wrench size={28} className="text-[#dda322]" />
            إدارة الصيانة
          </h1>
          <p className="mt-1 text-sm text-gray-500">تتبع طلبات الصيانة وإصلاح المنتجات المرتجعة.</p>
        </div>
        {permissions?.canManageMaintenance && (
          <Link
            href="/maintenance/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[#dda322] px-4 py-2 text-sm font-medium text-white hover:bg-[#b8861b] transition shadow-sm"
          >
            <Plus size={16} />
            طلب صيانة جديد
          </Link>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Clock size={16} className="text-blue-600" />
            <span>قيد المعالجة</span>
          </div>
          <p className="text-2xl font-bold text-[#061228]">
            {stats.find(s => s.status === "RECEIVED" || s.status === "UNDER_REPAIR" || s.status === "WAITING_PARTS")?._count || 0}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Wrench size={16} className="text-yellow-600" />
            <span>قيد الإصلاح</span>
          </div>
          <p className="text-2xl font-bold text-[#061228]">
            {stats.find(s => s.status === "UNDER_REPAIR")?._count || 0}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <CheckCircle size={16} className="text-green-600" />
            <span>مكتمل</span>
          </div>
          <p className="text-2xl font-bold text-[#061228]">
            {stats.find(s => s.status === "COMPLETED")?._count || 0}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Package size={16} className="text-gray-600" />
            <span>الإجمالي</span>
          </div>
          <p className="text-2xl font-bold text-[#061228]">{totalItems}</p>
        </div>
      </div>

      {/* Filters */}
      <form className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            name="search"
            defaultValue={searchQuery}
            placeholder="ابحث برقم الصيانة، اسم العميل، أو الملاحظات..."
            className="w-full rounded-lg border border-gray-300 py-2 pr-10 pl-3 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]"
          />
        </div>
        <select
          name="status"
          defaultValue={statusFilter}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]"
        >
          <option value="">كل الحالات</option>
          <option value="RECEIVED">تم الاستلام</option>
          <option value="UNDER_REPAIR">قيد الإصلاح</option>
          <option value="WAITING_PARTS">بانتظار قطع الغيار</option>
          <option value="COMPLETED">مكتمل</option>
          <option value="RETURNED">تم الإرجاع</option>
          <option value="SCRAPPED">تم الإتلاف</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-[#dda322] px-4 py-2 text-sm font-medium text-white hover:bg-[#b8861b] transition shadow-sm"
        >
          تطبيق
        </button>
      </form>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="overflow-x-auto force-ltr">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">رقم الصيانة</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">العميل</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">المنتجات</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ الاستلام</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {maintenances.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                    لا توجد طلبات صيانة مطابقة.
                  </td>
                </tr>
              ) : (
                maintenances.map((maintenance) => (
                  <tr key={maintenance.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900 font-mono">
                        {maintenance.maintenanceNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {maintenance.customer ? (
                        <div className="flex items-center gap-2">
                          <Users size={14} className="text-gray-400" />
                          <span className="font-medium text-gray-900">{maintenance.customer.name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">غير محدد</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="space-y-1">
                        {maintenance.items.slice(0, 2).map((item) => (
                          <div key={item.id} className="flex items-center gap-1 text-gray-700">
                            <Package size={12} className="text-gray-400" />
                            <span>{item.product.name}</span>
                            <span className="text-xs text-gray-500">×{item.quantity}</span>
                          </div>
                        ))}
                        {maintenance.items.length > 2 && (
                          <p className="text-xs text-gray-500">+{maintenance.items.length - 2} منتجات أخرى</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {maintenance.receivedDate.toLocaleDateString("ar-EG")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getStatusBadge(maintenance.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <Link
                        href={`/maintenance/${maintenance.id}`}
                        className="inline-flex items-center gap-1 text-[#061228] hover:text-[#dda322] p-1 rounded hover:bg-gray-100 transition"
                        title="عرض التفاصيل"
                      >
                        <Eye size={18} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination totalItems={totalItems} currentPage={currentPage} baseUrl="/maintenance" searchQuery={searchQuery} />
    </div>
  )
}