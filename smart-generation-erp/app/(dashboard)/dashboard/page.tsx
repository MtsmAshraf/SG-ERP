import { prisma } from "@/lib/prisma"
import { requireRole, getUserPermissions } from "@/lib/auth-utils"
import Link from "next/link"
import { 
  Package, Users, AlertTriangle, Truck, ShoppingCart,
  DollarSign, TrendingUp, Clock, CheckCircle2, Wallet, Warehouse, Trophy
} from "lucide-react"
import { getCurrencySymbol } from "@/lib/settings"
import { getUsdToEgpRate } from "@/lib/usd-rate" 

export default async function DashboardPage() {
  const session = await requireRole("ADMIN", "STAFF")
  const permissions = await getUserPermissions()
  const currency = await getCurrencySymbol()
  const usdRate = await getUsdToEgpRate()

  // --- DATA FETCHING ---
  const [
    totalProducts,
    totalCustomers,
    totalSuppliers,
    confirmedSalesOrders,
    confirmedPurchaseOrders,
    totalRevenueResult,
    totalPurchasesResult,
    lowStockProducts,
    recentSalesOrders,
    recentPurchaseOrders,
    pendingOffersCount,
    pendingOffers,
    confirmedOrderItems,
    allProducts,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.customer.count(),
    prisma.supplier.count(),
    prisma.salesOrder.count({ where: { status: "CONFIRMED" } }),
    prisma.purchaseOrder.count({ where: { status: "CONFIRMED" } }),
    prisma.salesOrder.aggregate({ _sum: { total: true }, where: { status: "CONFIRMED" } }),
    prisma.purchaseOrder.aggregate({ _sum: { total: true }, where: { status: "CONFIRMED" } }),
    prisma.product.findMany({ where: { currentStock: { lte: 10 } }, orderBy: { currentStock: "asc" }, take: 5 }),
    prisma.salesOrder.findMany({ where: { status: "CONFIRMED" }, orderBy: { createdAt: "desc" }, take: 5, include: { customer: true } }),
    prisma.purchaseOrder.findMany({ where: { status: "CONFIRMED" }, orderBy: { createdAt: "desc" }, take: 5, include: { supplier: true } }),
    prisma.priceOffer.count({ where: { status: "PENDING_APPROVAL" } }),
    prisma.priceOffer.findMany({ where: { status: "PENDING_APPROVAL" }, orderBy: { createdAt: "desc" }, take: 5, include: { customer: true, createdBy: { select: { name: true } } } }),
    prisma.orderItem.findMany({ 
      where: { salesOrder: { status: "CONFIRMED" } }, 
      include: { product: { select: { costPrice: true, costPriceUSD: true } } } 
    }),
    prisma.product.findMany({ select: { currentStock: true, costPrice: true, costPriceUSD: true } }),
  ])

  const totalRevenue = totalRevenueResult._sum.total?.toNumber() || 0
  const totalPurchases = totalPurchasesResult._sum.total?.toNumber() || 0

  const cogs = confirmedOrderItems.reduce((sum, item) => {
    const costUSD = item.product.costPriceUSD ? item.product.costPriceUSD.toNumber() : 0
    const costEGP = costUSD * usdRate
    return sum + (item.quantity * costEGP)
  }, 0)
  
  const grossProfit = totalRevenue - cogs
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0
  const cashFlow = totalRevenue - totalPurchases
  
  const inventoryValue = allProducts.reduce((sum, p) => {
    const costUSD = p.costPriceUSD ? p.costPriceUSD.toNumber() : 0
    const costEGP = costUSD * usdRate
    return sum + (p.currentStock * costEGP)
  }, 0)

  // ✅ FETCH BEST SELLERS (Top 5 by quantity sold in confirmed orders)
  const bestSellersRaw = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: { salesOrder: { status: "CONFIRMED" } },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: "desc" } },
    take: 5,
  })

  let bestSellers: { product: any; totalQuantity: number }[] = []
  if (bestSellersRaw.length > 0) {
    const productIds = bestSellersRaw.map((item) => item.productId)
    const productsMap = new Map(
      (await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, sku: true, unit: true },
      })).map((p) => [p.id, p])
    )

    bestSellers = bestSellersRaw
      .map((item) => ({
        product: productsMap.get(item.productId),
        totalQuantity: item._sum.quantity || 0,
      }))
      .filter((item) => item.product) as { product: any; totalQuantity: number }[]
  }

  // --- UI RENDERING ---
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#061228]">نظرة عامة على لوحة التحكم</h1>
        <p className="mt-1 text-sm text-gray-500">
          مرحباً بعودتك، {session.user.name}. إليك ما يحدث في أعمالك.
        </p>
      </div>

      {/* Financial Overview */}
      {(permissions?.canViewSalesOrders || permissions?.canViewPurchaseOrders || permissions?.canViewProducts) && (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">النظرة المالية</h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {permissions?.canViewSalesOrders && (
              <FinancialStatCard title="إجمالي الإيرادات" value={`${currency} ${totalRevenue.toFixed(2)}`} subtitle={`${confirmedSalesOrders} طلب مؤكد`} icon={<DollarSign className="text-green-600" size={20} />} bgColor="bg-green-50" iconBg="bg-green-100" />
            )}
            {permissions?.canViewPurchaseOrders && (
              <FinancialStatCard title="إجمالي المشتريات" value={`${currency} ${totalPurchases.toFixed(2)}`} subtitle={`${confirmedPurchaseOrders} أمر شراء مؤكد`} icon={<ShoppingCart className="text-blue-600" size={20} />} bgColor="bg-blue-50" iconBg="bg-blue-100" />
            )}
            {permissions?.canViewProducts && (
              <FinancialStatCard title="قيمة المخزون" value={`${currency} ${inventoryValue.toFixed(2)}`} subtitle="البضائع المتوفرة في المخزن" icon={<Warehouse className="text-amber-600" size={20} />} bgColor="bg-amber-50" iconBg="bg-amber-100" />
            )}
          </div>

          <div className="mt-4 grid gap-4 grid-cols-1 md:grid-cols-2">
            {permissions?.canViewSalesOrders && (
              <FinancialStatCard title="إجمالي الربح" value={`${currency} ${grossProfit.toFixed(2)}`} subtitle={`${profitMargin.toFixed(1)}% هامش ربح (الإيرادات - التكلفة)`} icon={<TrendingUp className="text-purple-600" size={20} />} bgColor="bg-purple-50" iconBg="bg-purple-100" valueColor={grossProfit >= 0 ? "text-purple-900" : "text-red-600"} />
            )}
            {permissions?.canViewSalesOrders && permissions?.canViewPurchaseOrders && (
              <FinancialStatCard title="التدفق النقدي" value={`${currency} ${cashFlow.toFixed(2)}`} subtitle="الداخل - الخارج (الإيرادات - المشتريات)" icon={<Wallet className="text-teal-600" size={20} />} bgColor="bg-teal-50" iconBg="bg-teal-100" valueColor={cashFlow >= 0 ? "text-teal-900" : "text-red-600"} />
            )}
          </div>
        </section>
      )}

      {/* Business Entities */}
      {(permissions?.canViewProducts || permissions?.canViewCustomers || permissions?.canViewSuppliers) && (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">الكيانات التجارية</h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            {permissions?.canViewProducts && (
              <Link href="/products" className="block">
                <div className="rounded-lg border bg-white p-6 shadow-sm transition hover:shadow-md cursor-pointer">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-500">إجمالي المنتجات</p>
                    <div className="rounded-full bg-indigo-100 p-2"><Package className="text-indigo-600" size={20} /></div>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-[#061228]">{totalProducts}</p>
                  <p className="mt-1 text-xs text-gray-500">في الكتالوج</p>
                </div>
              </Link>
            )}
            {permissions?.canViewCustomers && (
              <Link href="/customers" className="block">
                <div className="rounded-lg border bg-white p-6 shadow-sm transition hover:shadow-md cursor-pointer">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-500">إجمالي العملاء</p>
                    <div className="rounded-full bg-orange-100 p-2"><Users className="text-orange-600" size={20} /></div>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-[#061228]">{totalCustomers}</p>
                  <p className="mt-1 text-xs text-gray-500">حسابات نشطة</p>
                </div>
              </Link>
            )}
            {permissions?.canViewSuppliers && (
              <Link href="/suppliers" className="block">
                <div className="rounded-lg border bg-white p-6 shadow-sm transition hover:shadow-md cursor-pointer">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-500">إجمالي الموردين</p>
                    <div className="rounded-full bg-teal-100 p-2"><Truck className="text-teal-600" size={20} /></div>
                  </div>
                  <p className="mt-2 text-3xl font-bold text-[#061228]">{totalSuppliers}</p>
                  <p className="mt-1 text-xs text-gray-500">شركاء التوريد</p>
                </div>
              </Link>
            )}
          </div>
        </section>
      )}

      {/* Action Items & Performance */}
      <section className="grid gap-8 grid-cols-1 lg:grid-cols-2">
        {permissions?.canViewProducts && permissions?.canCreateProducts && (
          <div className="rounded-lg border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="text-red-500" size={20} />
                <h2 className="text-lg font-bold text-[#061228]">تنبيهات انخفاض المخزون</h2>
              </div>
              <Link href="/products" className="text-sm text-[#dda322] hover:text-[#b8861b] font-medium">عرض الكل ←</Link>
            </div>
            <div className="divide-y">
              {lowStockProducts.length === 0 ? (
                <div className="p-6 text-center"><CheckCircle2 className="mx-auto mb-2 text-green-500" size={32} /><p className="text-sm text-gray-500">جميع مستويات المخزون صحية.</p></div>
              ) : (
                lowStockProducts.map((product) => (
                  <Link key={product.id} href={`/products/${product.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-bold ${product.currentStock === 0 ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
                      {product.currentStock} {product.unit}
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}

        {permissions?.canApprovePriceOffers && (
          <div className="rounded-lg border bg-white shadow-sm">
            <div className="flex items-center justify-between border-b p-4">
              <div className="flex items-center gap-2">
                <Clock className="text-yellow-500" size={20} />
                <h2 className="text-lg font-bold text-[#061228]">الموافقات المعلقة</h2>
              </div>
              <Link href="/price-offers" className="text-sm text-[#dda322] hover:text-[#b8861b] font-medium">عرض الكل ←</Link>
            </div>
            <div className="divide-y">
              {pendingOffers.length === 0 ? (
                <div className="p-6 text-center"><CheckCircle2 className="mx-auto mb-2 text-green-500" size={32} /><p className="text-sm text-gray-500">لا توجد عروض بانتظار الموافقة.</p></div>
              ) : (
                pendingOffers.map((offer) => (
                  <Link key={offer.id} href={`/price-offers/${offer.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
                    <div>
                      <p className="font-bold text-gray-900">{offer.offerNumber}</p>
                      <p className="text-xs text-gray-500">{offer.customer.name} • بواسطة {offer.createdBy.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{currency} {offer.total.toNumber().toFixed(2)}</p>
                      <p className="text-xs text-gray-500">{offer.createdAt.toLocaleDateString('ar-EG')}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </section>

      {/* ✅ NEW: Best Sellers Section */}
      {permissions?.canViewProducts && permissions?.canViewSalesOrders && (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
            <Trophy className="text-[#dda322]" size={18} /> الأكثر مبيعاً
          </h2>
          <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
            <div className="divide-y">
              {bestSellers.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">لا توجد بيانات مبيعات كافية بعد.</div>
              ) : (
                bestSellers.map((item, index) => (
                  <Link key={item.product.id} href={`/products/${item.product.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
                    <div className="flex items-center gap-4">
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        index === 0 ? "bg-yellow-100 text-yellow-700" :
                        index === 1 ? "bg-gray-100 text-gray-700" :
                        index === 2 ? "bg-orange-100 text-orange-700" : "bg-blue-50 text-blue-700"
                      }`}>
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{item.product.name}</p>
                        <p className="text-xs text-gray-500">SKU: {item.product.sku || "—"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#dda322]">{item.totalQuantity} {item.product.unit}</p>
                      <p className="text-xs text-gray-500">إجمالي المبيعات</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* Recent Activity */}
      {(permissions?.canViewSalesOrders || permissions?.canViewPurchaseOrders) && (
        <section className="grid gap-8 grid-cols-1 lg:grid-cols-2">
          {permissions?.canViewSalesOrders && (
            <div className="rounded-lg border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="text-green-600" size={20} />
                  <h2 className="text-lg font-bold text-[#061228]">أوامر البيع الأخيرة</h2>
                </div>
                <Link href="/sales-orders" className="text-sm text-[#dda322] hover:text-[#b8861b] font-medium">عرض الكل ←</Link>
              </div>
              <div className="divide-y">
                {recentSalesOrders.length === 0 ? (
                  <p className="p-6 text-center text-sm text-gray-500">لا توجد أوامر بيع مؤكدة بعد.</p>
                ) : (
                  recentSalesOrders.map((order) => (
                    <Link href={`/sales-orders/${order.id}`} key={order.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
                      <div>
                        <p className="font-bold text-gray-900">{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">{order.customer.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{currency} {order.total.toNumber().toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{order.createdAt.toLocaleDateString('ar-EG')}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}

          {permissions?.canViewPurchaseOrders && (
            <div className="rounded-lg border bg-white shadow-sm">
              <div className="flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="text-blue-600" size={20} />
                  <h2 className="text-lg font-bold text-[#061228]">أوامر الشراء الأخيرة</h2>
                </div>
                <Link href="/purchase-orders" className="text-sm text-[#dda322] hover:text-[#b8861b] font-medium">عرض الكل ←</Link>
              </div>
              <div className="divide-y">
                {recentPurchaseOrders.length === 0 ? (
                  <p className="p-6 text-center text-sm text-gray-500">لا توجد أوامر شراء مؤكدة بعد.</p>
                ) : (
                  recentPurchaseOrders.map((po) => (
                    <Link href={`/purchase-orders/${po.id}`} key={po.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
                      <div>
                        <p className="font-bold text-gray-900">{po.poNumber}</p>
                        <p className="text-xs text-gray-500">{po.supplier.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{currency} {po.total.toNumber().toFixed(2)}</p>
                        <p className="text-xs text-gray-500">{po.createdAt.toLocaleDateString('ar-EG')}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function FinancialStatCard({ title, value, subtitle, icon, bgColor, iconBg, valueColor = "text-gray-900" }: any) {
  return (
    <div className={`rounded-lg border bg-white p-6 shadow-sm transition hover:shadow-md ${bgColor}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <div className={`rounded-full p-2 ${iconBg}`}>{icon}</div>
      </div>
      <p className={`mt-2 text-3xl font-bold ${valueColor}`}>{value}</p>
      <p className="mt-1 text-xs text-gray-500">{subtitle}</p>
    </div>
  )
}