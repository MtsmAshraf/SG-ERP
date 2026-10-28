import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import { Prisma } from "@prisma/client"
import Link from "next/link"
import { Search, Filter, RotateCcw } from "lucide-react"
import { Pagination } from "@/components/Pagination"
import { PAGE_SIZE } from "@/lib/pagination"

export default async function ActivityLogPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  await requirePermission("canViewActivityLog")
  
  const params = await searchParams
  const currentPage = Number(params.page) || 1
  const searchQuery = (params.search as string) || ""
  const actionFilter = (params.action as string) || ""
  const entityFilter = (params.entity as string) || ""

  const where: Prisma.ActivityLogWhereInput = {
    AND: [
      searchQuery ? {
        OR: [
          { entityName: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } },
          { user: { name: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } } },
          { details: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } },
        ]
      } : {},
      actionFilter ? { action: actionFilter as any } : {},
      entityFilter ? { entityType: entityFilter } : {},
    ]
  }

  const [logs, totalItems] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { 
        user: { select: { name: true, email: true } } 
      }
    }),
    prisma.activityLog.count({ where }),
  ])

  const getActionBadge = (action: string) => {
    const styles: Record<string, string> = {
      CREATE: "bg-green-100 text-green-800",
      UPDATE: "bg-blue-100 text-blue-800",
      DELETE: "bg-red-100 text-red-800",
      APPROVE: "bg-emerald-100 text-emerald-800",
      REJECT: "bg-orange-100 text-orange-800",
      CONFIRM: "bg-teal-100 text-teal-800",
      CONVERT: "bg-purple-100 text-purple-800",
      LOGIN: "bg-indigo-100 text-indigo-800",
      LOGOUT: "bg-gray-100 text-gray-800",
      EXPORT: "bg-cyan-100 text-cyan-800",
      PAY: "bg-lime-100 text-lime-800",
    }
    return styles[action] || "bg-gray-100 text-gray-800"
  }

  const getActionText = (action: string) => {
    const texts: Record<string, string> = {
      CREATE: "إنشاء",
      UPDATE: "تعديل",
      DELETE: "حذف",
      APPROVE: "اعتماد",
      REJECT: "رفض",
      CONFIRM: "تأكيد",
      CONVERT: "تحويل",
      LOGIN: "تسجيل دخول",
      LOGOUT: "تسجيل خروج",
      EXPORT: "تصدير",
      PAY: "دفع",
    }
    return texts[action] || action
  }

  const getEntityTypeText = (type: string) => {
    const texts: Record<string, string> = {
      Product: "منتج",
      Customer: "عميل",
      Supplier: "مورد",
      SalesOrder: "أمر بيع",
      PurchaseOrder: "أمر شراء",
      PriceOffer: "عرض سعر",
      Invoice: "فاتورة",
      User: "مستخدم",
      Employee: "موظف",
      Department: "قسم",
      Leave: "إجازة",
      Payslip: "كشف راتب",
      CompanySettings: "إعدادات الشركة",
    }
    return texts[type] || type
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#061228]">سجل النشاط</h1>
        <p className="mt-1 text-sm text-gray-500">تتبع جميع الإجراءات التي تمت في النظام.</p>
      </div>

      {/* Filters */}
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <form className="grid gap-4 md:grid-cols-12 items-end">
          <div className="relative md:col-span-4">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              name="search"
              defaultValue={searchQuery}
              placeholder="ابحث بالاسم، المستخدم، أو التفاصيل..."
              className="w-full rounded-lg border border-gray-300 py-2 pr-10 pl-3 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]"
            />
          </div>
          
          <div className="md:col-span-3">
            <select 
              name="action" 
              defaultValue={actionFilter}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]"
            >
              <option value="">كل الإجراءات</option>
              <option value="CREATE">إنشاء</option>
              <option value="UPDATE">تعديل</option>
              <option value="DELETE">حذف</option>
              <option value="APPROVE">اعتماد</option>
              <option value="REJECT">رفض</option>
              <option value="CONFIRM">تأكيد</option>
              <option value="CONVERT">تحويل</option>
              <option value="PAY">دفع</option>
              <option value="EXPORT">تصدير</option>
            </select>
          </div>

          <div className="md:col-span-3">
            <select 
              name="entity" 
              defaultValue={entityFilter}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]"
            >
              <option value="">كل الأنواع</option>
              <option value="Product">منتج</option>
              <option value="Customer">عميل</option>
              <option value="Supplier">مورد</option>
              <option value="SalesOrder">أمر بيع</option>
              <option value="PurchaseOrder">أمر شراء</option>
              <option value="PriceOffer">عرض سعر</option>
              <option value="Invoice">فاتورة</option>
              <option value="User">مستخدم</option>
              <option value="Employee">موظف</option>
              <option value="Department">قسم</option>
              <option value="Leave">إجازة</option>
              <option value="Payslip">كشف راتب</option>
              <option value="CompanySettings">إعدادات</option>
            </select>
          </div>

          <div className="md:col-span-2 flex gap-2">
            <button 
              type="submit" 
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#dda322] px-4 py-2 text-sm font-medium text-white hover:bg-[#b8861b] transition shadow-sm"
            >
              <Search size={16} />
              بحث
            </button>
            <Link 
              href="/activity-log"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              title="إعادة تعيين الفلاتر"
            >
              <RotateCcw size={16} />
            </Link>
          </div>
        </form>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto force-ltr">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الوقت</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">المستخدم</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراء</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">النوع</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الكيان</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">التفاصيل</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">
                    لا توجد سجلات نشاط تطابق معايير البحث.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.createdAt.toLocaleString('ar-EG', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {log.user ? (
                        <div>
                          <p className="font-medium text-gray-900">{log.user.name}</p>
                          <p className="text-xs text-gray-500">{log.user.email}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">نظام</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionBadge(log.action)}`}>
                        {getActionText(log.action)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {getEntityTypeText(log.entityType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {log.entityName || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={log.details || ""}>
                      {log.details || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-mono">
                      {log.ipAddress || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination 
        totalItems={totalItems} 
        currentPage={currentPage} 
        baseUrl="/activity-log" 
        searchQuery={searchQuery} 
      />
    </div>
  )
}