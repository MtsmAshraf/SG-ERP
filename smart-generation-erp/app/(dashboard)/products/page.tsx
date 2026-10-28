import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { requirePermission, getUserPermissions } from "@/lib/auth-utils"
import { Pagination } from "@/components/Pagination"
import { PAGE_SIZE } from "@/lib/pagination"
import Link from "next/link"
import { Search, Eye, Pencil, Package, AlertTriangle } from "lucide-react"
import { DeleteProductButton } from "./DeleteProductButton"
import { getCurrencySymbol } from "@/lib/settings"
import { getUsdToEgpRate } from "@/lib/usd-rate"

async function getStockBreakdown(productId: string) {
  const [depositQty, custodyQty] = await Promise.all([
    prisma.depositItem.aggregate({ _sum: { quantity: true }, where: { productId, status: "BORROWED" } }),
    prisma.custodyItem.aggregate({ _sum: { quantity: true }, where: { productId, status: "BORROWED" } })
  ])
  return { deposit: depositQty._sum.quantity || 0, custody: custodyQty._sum.quantity || 0 }
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  await requirePermission("canViewProducts")
  const permissions = await getUserPermissions()
  const currency = await getCurrencySymbol()
  const usdRate = await getUsdToEgpRate() // ✅ Dynamic rate from DB

  const params = await searchParams
  const currentPage = Number(params.page) || 1
  const searchQuery = (params.search as string) || ""
  const categoryFilter = (params.category as string) || ""

  const where: Prisma.ProductWhereInput = {
    AND: [
      searchQuery ? { OR: [{ name: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } }, { sku: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } }] } : {},
      categoryFilter ? { category: categoryFilter } : {},
    ]
  }

  const [productsRaw, totalItems, categories] = await Promise.all([
    prisma.product.findMany({ where, orderBy: { createdAt: "desc" }, skip: (currentPage - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.product.count({ where }),
    prisma.product.findMany({ select: { category: true }, distinct: ["category"] })
  ])

  // ✅ Convert Decimals to plain numbers AND calculate breakdown
  const productsWithBreakdown = await Promise.all(
    productsRaw.map(async (product) => {
      const breakdown = await getStockBreakdown(product.id)
      return { 
        ...product, 
        costPriceUSD: product.costPriceUSD.toNumber(),
        sellPriceUSD: product.sellPriceUSD.toNumber(),
        breakdown 
      }
    })
  )

  const uniqueCategories = categories.map(c => c.category).filter((cat): cat is string => Boolean(cat))

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#061228]">المنتجات</h1>
          <p className="mt-1 text-sm text-gray-500">إدارة كتالوج المنتجات والمخزون.</p>
        </div>
        {permissions?.canCreateProducts && (
          <Link href="/products/new" className="inline-flex justify-center items-center px-4 py-2 bg-[#dda322] text-white rounded-lg hover:bg-[#b8861b] transition font-medium shadow-sm">
            + إضافة منتج جديد
          </Link>
        )}
      </div>

      {/* USD Rate Quick Edit */}
      {permissions?.canManageUsdRate && (
        <div className="mb-4 rounded-lg border border-[#dda322]/30 bg-[#dda322]/5 p-4">
          <form action={async (formData) => {
            "use server"
            const { prisma } = await import("@/lib/prisma")
            const { requirePermission } = await import("@/lib/auth-utils")
            const { revalidatePath } = await import("next/cache")
            await requirePermission("canManageUsdRate") 
            const rate = parseFloat(formData.get("usdRate") as string) || 50
            await prisma.companySettings.upsert({
              where: { id: "global_settings" },
              update: { usdToEgpRate: rate },
              create: { id: "global_settings", usdToEgpRate: rate }
            })
            revalidatePath("/products")
          }} className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">سعر الصرف الحالي:</span>
              <input name="usdRate" type="number" step="0.01" min="0" defaultValue={usdRate} className="w-32 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]" />
              <span className="text-sm text-gray-500">EGP / USD</span>
            </div>
            <button type="submit" className="rounded-lg bg-[#dda322] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#b8861b] transition">تحديث السعر</button>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-col sm:flex-row gap-3">
        <form className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="text" name="search" defaultValue={searchQuery} placeholder="ابحث بالاسم أو رمز المنتج..." className="w-full rounded-lg border border-gray-300 py-2 pr-10 pl-3 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]" />
          <button type="submit" className="sr-only">بحث</button>
        </form>
        <select name="category" defaultValue={categoryFilter} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]">
          <option value="">كل الفئات</option>
          {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="overflow-x-auto force-ltr">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">المنتج</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الفئة</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">سعر التكلفة (USD)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">سعر البيع (USD)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">المخزون</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productsWithBreakdown.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">لا توجد منتجات مطابقة لـ "{searchQuery}".</td></tr>
              ) : (
                productsWithBreakdown.map((product) => {
                  const totalStock = product.currentStock + product.breakdown.deposit + product.breakdown.custody
                  const isLowStock = totalStock <= 10
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#dda322]/10"><Package className="text-[#dda322]" size={20} /></div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{product.category || "-"}</td>
                      
                      {/* ✅ Cost Price Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="font-semibold text-gray-900">${product.costPriceUSD.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">≈ {currency} {(product.costPriceUSD * usdRate).toFixed(2)}</div>
                      </td>
                      
                      {/* ✅ Sell Price Column */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="font-semibold text-[#dda322]">${product.sellPriceUSD.toFixed(2)}</div>
                        <div className="text-xs text-gray-500">≈ {currency} {(product.sellPriceUSD * usdRate).toFixed(2)}</div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${isLowStock ? "text-red-600" : "text-gray-900"}`}>{totalStock} {product.unit}</span>
                          {isLowStock && <AlertTriangle size={14} className="text-red-500" />}
                        </div>
                        <div className="mt-1 text-xs text-gray-500" dir="rtl">
                          ({product.currentStock} مخزن
                          {product.breakdown.deposit > 0 && ` + ${product.breakdown.deposit} أمانة`}
                          {product.breakdown.custody > 0 && ` + ${product.breakdown.custody} عهدة`})
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          {permissions?.canViewProducts && (
                            <Link href={`/products/${product.id}`} className="text-[#061228] hover:text-[#dda322] p-1 rounded hover:bg-gray-100 transition" title="عرض التفاصيل"><Eye size={18} /></Link>
                          )}
                          {permissions?.canEditProducts && (
                            <Link href={`/products/${product.id}/edit`} className="text-[#dda322] hover:text-[#b8861b] p-1 rounded hover:bg-[#dda322]/10 transition" title="تعديل المنتج"><Pencil size={18} /></Link>
                          )}
                          {permissions?.canDeleteProducts && <DeleteProductButton productId={product.id} productName={product.name} />}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination totalItems={totalItems} currentPage={currentPage} baseUrl="/products" searchQuery={searchQuery} />
    </div>
  )
}