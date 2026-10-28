import { prisma } from "@/lib/prisma"
import { requirePermission, getUserPermissions } from "@/lib/auth-utils"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Package, Warehouse, Users, Briefcase, Hash, Zap, Activity, Pencil, History, ArrowUpCircle, ArrowDownCircle, RefreshCw } from "lucide-react"

export default async function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("canViewProducts")
  const permissions = await getUserPermissions()
  const { id } = await params

    const product = await prisma.product.findUnique({
    where: { id },
    include: {
      depositItems: { include: { deposit: true } }, 
      custodyItems: { include: { custody: { include: { employee: true } } } },
      stockMovements: { 
        orderBy: { createdAt: "desc" }, 
        take: 50,
        // ✅ Removed the 'user' include to match your current schema
      }
    }
  })

  if (!product) notFound()

  // ✅ Calculate Stock Totals
  const warehouseStock = product.currentStock
  const depositStock = product.depositItems.reduce((sum: number, item: any) => sum + item.quantity, 0)
  const custodyStock = product.custodyItems.reduce((sum: number, item: any) => sum + item.quantity, 0)
  const totalStock = warehouseStock + depositStock + custodyStock

  // Helper to safely display Decimal/Number fields
  const displayValue = (val: any) => val ? (typeof val.toNumber === 'function' ? val.toNumber() : val) : null

  // Helper for Movement Type Badge
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

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href="/products" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#dda322] transition mb-2">
            <ArrowRight size={16} /> العودة إلى المنتجات
          </Link>
          <h1 className="text-2xl font-bold text-[#061228]">تفاصيل المنتج</h1>
        </div>

        {permissions?.canEditProducts && (
          <Link 
            href={`/products/${product.id}/edit`} 
            className="inline-flex items-center gap-2 rounded-lg bg-[#dda322] px-4 py-2 text-sm font-medium text-white hover:bg-[#b8861b] transition shadow-sm"
          >
            <Pencil size={16} /> تعديل المنتج
          </Link>
        )}
      </div>

      {/* Main Info Card */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
              <Hash size={14} /> Part Number (رقم القطعة)
            </label>
            <p className="mt-1 text-lg font-bold text-[#061228]">{product.name}</p>
          </div>
          
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase">SKU</label>
            <p className="mt-1 text-lg font-semibold text-gray-900">{product.sku || "—"}</p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
              <Zap size={14} /> Power (الطاقة)
            </label>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {displayValue(product.power) ? `${displayValue(product.power)} kW` : "—"}
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
              <Activity size={14} /> Volt (الجهد)
            </label>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {displayValue(product.volt) ? `${displayValue(product.volt)} V` : "—"}
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-medium text-gray-500 uppercase">Full Name and Specs (الاسم الكامل والمواصفات)</label>
            <div className="mt-1 p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-700 whitespace-pre-line min-h-[80px]">
              {product.description || "لا توجد مواصفات مسجلة."}
            </div>
          </div>
        </div>
      </div>

      {/* Stock Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Warehouse size={16} className="text-blue-600" />
            <span>المخزن الرئيسي</span>
          </div>
          <p className="text-2xl font-bold text-[#061228]">{warehouseStock}</p>
        </div>
        
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Package size={16} className="text-purple-600" />
            <span>الودائع</span>
          </div>
          <p className="text-2xl font-bold text-[#061228]">{depositStock}</p>
        </div>

        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Users size={16} className="text-orange-600" />
            <span>العهدة</span>
          </div>
          <p className="text-2xl font-bold text-[#061228]">{custodyStock}</p>
        </div>

        <div className="rounded-lg border-2 border-[#dda322] bg-[#dda322]/5 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-[#b8861b] font-bold mb-2">
            <Briefcase size={16} />
            <span>الإجمالي الكلي</span>
          </div>
          <p className="text-2xl font-bold text-[#b8861b]">{totalStock}</p>
        </div>
      </div>

      {/* Detailed Breakdown Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Deposits Table */}
        <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
          <div className="border-b bg-gray-50 px-4 py-3">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Package size={16} className="text-purple-600" /> تفاصيل الودائع
            </h3>
          </div>
          {product.depositItems.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">لا توجد ودائع لهذا المنتج.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">اسم الوديعة</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">الكمية</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {product.depositItems.map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900 font-medium">{item.deposit?.name || "غير محدد"}</td>
                      <td className="px-4 py-3 text-gray-900">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Custodies Table */}
        <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
          <div className="border-b bg-gray-50 px-4 py-3">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Users size={16} className="text-orange-600" /> تفاصيل العهدة
            </h3>
          </div>
          {product.custodyItems.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">لا توجد عهد لهذا المنتج.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">الموظف</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">الكمية</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {product.custodyItems.map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900 font-medium">
                        {item.custody?.employee?.firstName} {item.custody?.employee?.lastName}
                      </td>
                      <td className="px-4 py-3 text-gray-900">{item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ✅ RESTORED: Stock Movement History Table */}
      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <div className="border-b bg-gray-50 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#061228] flex items-center gap-2">
            <History size={20} className="text-[#dda322]" /> سجل حركات المخزون
          </h2>
          <span className="text-xs text-gray-500">آخر 50 حركة</span>
        </div>

        {product.stockMovements.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">لا توجد حركات مخزون مسجلة لهذا المنتج.</div>
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
                {product.stockMovements.map((movement: any) => (
                  <tr key={movement.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {movement.createdAt.toLocaleDateString('ar-EG')} <span className="text-gray-400 text-xs">{movement.createdAt.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getMovementBadge(movement.type)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${movement.type === 'STOCK_OUT' ? 'text-red-600' : 'text-green-600'}`}>
                      {movement.type === 'STOCK_OUT' ? '-' : '+'}{movement.quantity}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate" title={movement.reason}>
                      {movement.reason || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      النظام {/* Default fallback since 'user' relation is missing */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}