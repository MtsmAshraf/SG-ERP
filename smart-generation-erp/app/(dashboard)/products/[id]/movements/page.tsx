import { Prisma, StockMovementType } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import { notFound } from "next/navigation"
import Link from "next/link"
import { 
  ArrowRight, History, ArrowUpCircle, ArrowDownCircle, 
  RefreshCw, Package, Search 
} from "lucide-react"
import { Pagination } from "@/components/Pagination"
import { PAGE_SIZE } from "@/lib/pagination"

export default async function ProductMovementsPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await requirePermission("canViewProducts")
  const { id } = await params
  const sp = await searchParams
  
  const currentPage = Number(sp.page) || 1
  const searchQuery = (sp.search as string) || ""
  const typeFilter = (sp.type as string) || ""

  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true, name: true, sku: true }
  })

  if (!product) notFound()

  const where: Prisma.StockMovementWhereInput = {
    productId: id,
    ...(searchQuery && {
      reason: { contains: searchQuery, mode: Prisma.QueryMode.insensitive }
    }),
    ...(typeFilter && { 
      type: typeFilter as StockMovementType 
    })
  }

  const [movements, totalItems] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        user: { select: { name: true } }
      }
    }),
    prisma.stockMovement.count({ where })
  ])

  const getMovementBadge = (type: string) => {
    switch (type) {
      case "STOCK_IN":
        return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800"><ArrowUpCircle size={12} /> إدخال</span>
      case "STOCK_OUT":
        return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800"><ArrowDownCircle size={12} /> إخراج</span>
      case "ADJUSTMENT":
        return <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800"><RefreshCw size={12} /> تسوية</span>
      default:
        return <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800">{type}</span>
    }
  }

  const totalIn = movements
    .filter(m => m.type === "STOCK_IN")
    .reduce((sum, m) => sum + m.quantity, 0)
  const totalOut = movements
    .filter(m => m.type === "STOCK_OUT")
    .reduce((sum, m) => sum + m.quantity, 0)

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div>
        <Link 
          href={`/products/${product.id}`} 
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#dda322] transition mb-2"
        >
          <ArrowRight size={16} /> العودة إلى المنتج
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#dda322]/10">
            <History className="text-[#dda322]" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#061228]">سجل حركات المخزون</h1>
            <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
              <Package size={14} />
              <span className="font-medium">{product.name}</span>
              <span className="text-gray-400">•</span>
              <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{product.sku}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <ArrowUpCircle size={16} className="text-green-600" />
            <span>إجمالي الإدخال (في هذه الصفحة)</span>
          </div>
          <p className="text-2xl font-bold text-green-600">+{totalIn}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <ArrowDownCircle size={16} className="text-red-600" />
            <span>إجمالي الإخراج (في هذه الصفحة)</span>
          </div>
          <p className="text-2xl font-bold text-red-600">-{totalOut}</p>
        </div>
        <div className="rounded-lg border-2 border-[#dda322] bg-[#dda322]/5 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-[#b8861b] font-bold mb-2">
            <History size={16} />
            <span>إجمالي الحركات</span>
          </div>
          <p className="text-2xl font-bold text-[#b8861b]">{totalItems}</p>
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
            placeholder="ابحث في السبب / التفاصيل..."
            className="w-full rounded-lg border border-gray-300 py-2 pr-10 pl-3 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]"
          />
        </div>
        <select
          name="type"
          defaultValue={typeFilter}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]"
        >
          <option value="">كل الأنواع</option>
          <option value="STOCK_IN">إدخال</option>
          <option value="STOCK_OUT">إخراج</option>
          <option value="ADJUSTMENT">تسوية</option>
        </select>
        <div className="flex gap-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-[#dda322] px-4 py-2 text-sm font-medium text-white hover:bg-[#b8861b] transition shadow-sm"
          >
            تطبيق الفلتر
          </button>
          <Link
            href={`/products/${product.id}/movements`}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            إعادة تعيين
          </Link>
        </div>
      </form>
      {/* Movements Table */}
      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        {movements.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            لا توجد حركات مخزون مطابقة.
          </div>
        ) : (
          <div className="overflow-x-auto force-ltr">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">نوع الحركة</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الكمية</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">السبب / التفاصيل</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">بواسطة</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {movement.createdAt.toLocaleDateString('ar-EG')} 
                      <span className="text-gray-400 text-xs mr-1">
                        {movement.createdAt.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getMovementBadge(movement.type)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${
                      movement.type === 'STOCK_OUT' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {movement.type === 'STOCK_OUT' ? '-' : '+'}{movement.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate" title={movement.reason || ""}>
                      {movement.reason || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {movement.user?.name || "النظام"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <Pagination 
        totalItems={totalItems} 
        currentPage={currentPage} 
        baseUrl={`/products/${product.id}/movements`}
        searchQuery={searchQuery}
      />
    </div>
  )
} 