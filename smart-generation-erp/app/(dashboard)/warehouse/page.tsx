import { prisma } from "@/lib/prisma"
import { requirePermission, getUserPermissions } from "@/lib/auth-utils"
import Link from "next/link"
import { 
  Package, Boxes, AlertTriangle, ArrowDownCircle, ArrowUpCircle, 
  Plus, Search, Warehouse as WarehouseIcon, Users, UserCheck, Calendar,
  Wrench
} from "lucide-react"
import { WarehouseStockForm } from "./WarehouseStockForm"
import { AddCustomItemForm } from "./AddCustomItemForm"
import { ReturnToWarehouseButton } from "./ReturnToWarehouseButton"
import { PrintWarehouseButton } from "./PrintWarehouseButton"

export default async function WarehousePage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await requirePermission("canViewWarehouse")
  const permissions = await getUserPermissions()
  const params = await searchParams
  
  const activeView = (params.view as string) || "warehouse"
  const searchQuery = ((params.search as string) || "").toLowerCase()
  const stockFilter = params.stock as string

  // ✅ Fetch all data in parallel with CORRECT schema fields
  const [allProducts, customItems, depositItems, custodyItems, maintenanceItems] = await Promise.all([
    prisma.product.findMany({
      orderBy: { name: "asc" },
      include: {
        stockMovements: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true, type: true }
        }
      }
    }),
    prisma.warehouseCustomItem.findMany({
      orderBy: { name: "asc" },
      include: {
        movements: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true, type: true }
        }
      }
    }),
    prisma.depositItem.findMany({
      where: { quantity: { gt: 0 } },
      orderBy: [{ deposit: { recipientName: "asc" } }, { product: { name: "asc" } }],
      include: {
        deposit: { select: { id: true, recipientName: true } },
        product: { select: { id: true, name: true, sku: true, unit: true } }
      }
    }),
      prisma.custodyItem.findMany({
      where: { quantity: { gt: 0 } },
      orderBy: { custody: { date: "desc" } },
      include: {
        custody: { 
          include: { 
            // ✅ Added id: true here so the stats card can count unique employees
            employee: { select: { id: true, firstName: true, lastName: true } } 
          } 
        },
        product: { select: { id: true, name: true, sku: true, unit: true } }
      }
    }),
    prisma.maintenanceItem.findMany({
      where: { status: { notIn: ["RETURNED", "SCRAPPED"] } },
      orderBy: { maintenance: { receivedDate: "desc" } },
      include: {
        maintenance: { 
          select: { 
            maintenanceNumber: true, 
            customer: { select: { name: true } } 
          } 
        },
        product: { select: { id: true, name: true, sku: true, unit: true } },
        serialNumber: { select: { serialNumber: true } }
      }
    })
  ])
  // ✅ Calculate stats
  const totalProducts = allProducts.length
  const totalCustomItems = customItems.length
  const totalDepositItems = depositItems.length
  const totalCustodyItems = custodyItems.length
  const totalMaintenanceItems = maintenanceItems.length

  const lowStockCount = allProducts.filter(p => p.currentStock > 0 && p.currentStock <= 10).length +
                       customItems.filter(i => i.quantity > 0 && i.quantity <= 10).length
  const outOfStockCount = allProducts.filter(p => p.currentStock === 0).length +
                         customItems.filter(i => i.quantity === 0).length

  // ✅ Filter based on active view
  const filteredProducts = allProducts.filter(p => {
    const matchesSearch = !searchQuery || 
      p.name.toLowerCase().includes(searchQuery) || 
      p.sku.toLowerCase().includes(searchQuery)
    const matchesStock = !stockFilter || 
      (stockFilter === "low" && p.currentStock > 0 && p.currentStock <= 10) ||
      (stockFilter === "out" && p.currentStock === 0)
    return matchesSearch && matchesStock
  })

  const filteredCustomItems = customItems.filter(item => {
    const matchesSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery)
    const matchesStock = !stockFilter || 
      (stockFilter === "low" && item.quantity > 0 && item.quantity <= 10) ||
      (stockFilter === "out" && item.quantity === 0)
    return matchesSearch && matchesStock
  })

  const filteredDeposits = depositItems.filter(item => {
    return !searchQuery || 
      item.product.name.toLowerCase().includes(searchQuery) ||
      item.product.sku.toLowerCase().includes(searchQuery) ||
      item.deposit.recipientName.toLowerCase().includes(searchQuery)
  })

  const filteredCustodies = custodyItems.filter(item => {
    const employeeName = `${item.custody.employee.firstName} ${item.custody.employee.lastName}`.toLowerCase()
    return !searchQuery || 
      item.product.name.toLowerCase().includes(searchQuery) ||
      item.product.sku.toLowerCase().includes(searchQuery) ||
      employeeName.includes(searchQuery)
  })

    const filteredMaintenance = maintenanceItems.filter(item => {
    const customerName = item.maintenance.customer?.name || ""
    return !searchQuery || 
      item.product.name.toLowerCase().includes(searchQuery) ||
      item.product.sku.toLowerCase().includes(searchQuery) ||
      customerName.toLowerCase().includes(searchQuery) ||
      item.maintenance.maintenanceNumber.toLowerCase().includes(searchQuery)
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#061228] flex items-center gap-2">
            <WarehouseIcon size={28} className="text-[#dda322]" />
            إدارة المخزون
          </h1>
          <p className="mt-1 text-sm text-gray-500">تتبع المنتجات في المخزن الرئيسي والأمانات والعهد.</p>
        </div>
        <div className="flex gap-2">
          <PrintWarehouseButton activeView={activeView} />
          {permissions?.canManageWarehouse && activeView === "warehouse" && (
            <AddCustomItemForm />
          )}
        </div>
      </div>

      {/* ✅ Toggle Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-0">
        <TabButton 
          href="?view=warehouse" 
          label="المخزن الرئيسي" 
          count={totalProducts + totalCustomItems}
          icon={<WarehouseIcon size={16} />}
          active={activeView === "warehouse"}
        />
        <TabButton 
          href="?view=deposits" 
          label="الأمانات" 
          count={totalDepositItems}
          icon={<Boxes size={16} />}
          active={activeView === "deposits"}
        />
        <TabButton 
          href="?view=custodies" 
          label="العهد" 
          count={totalCustodyItems}
          icon={<Users size={16} />}
          active={activeView === "custodies"}
        />
        <TabButton 
          href="?view=maintenance" 
          label="الصيانة" 
          count={totalMaintenanceItems}
          icon={<Wrench size={16} />}
          active={activeView === "maintenance"}
        />
      </div>

      {/* Stats Cards - Only show for warehouse view */}
      {activeView === "warehouse" && (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <StatCard 
            title="منتجات الكتالوج" 
            value={totalProducts} 
            icon={<Package className="text-blue-600" size={20} />}
            bgColor="bg-blue-50"
          />
          <StatCard 
            title="بنود مخصصة" 
            value={totalCustomItems} 
            icon={<Boxes className="text-purple-600" size={20} />}
            bgColor="bg-purple-50"
          />
          <StatCard 
            title="مخزون منخفض" 
            value={lowStockCount} 
            icon={<AlertTriangle className="text-yellow-600" size={20} />}
            bgColor="bg-yellow-50"
            valueColor="text-yellow-700"
          />
          <StatCard 
            title="نفذ من المخزون" 
            value={outOfStockCount} 
            icon={<AlertTriangle className="text-red-600" size={20} />}
            bgColor="bg-red-50"
            valueColor="text-red-700"
          />
        </div>
      )}

      {/* Stats for Deposits view */}
      {activeView === "deposits" && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <StatCard 
            title="إجمالي البنود في الأمانات" 
            value={totalDepositItems} 
            icon={<Boxes className="text-purple-600" size={20} />}
            bgColor="bg-purple-50"
          />
          <StatCard 
            title="عدد الأمانات النشطة" 
            value={new Set(depositItems.map(i => i.deposit.id)).size}
            icon={<Package className="text-blue-600" size={20} />}
            bgColor="bg-blue-50"
          />
          <StatCard 
            title="إجمالي الكميات" 
            value={depositItems.reduce((sum, i) => sum + i.quantity, 0)}
            icon={<ArrowDownCircle className="text-green-600" size={20} />}
            bgColor="bg-green-50"
          />
        </div>
      )}

      {/* Stats for Custodies view */}
      {activeView === "custodies" && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <StatCard 
            title="إجمالي العهد" 
            value={totalCustodyItems} 
            icon={<Users className="text-orange-600" size={20} />}
            bgColor="bg-orange-50"
          />
          <StatCard 
            title="عدد الموظفين" 
            value={new Set(custodyItems.map(i => i.custody.employee.id)).size}
            icon={<UserCheck className="text-teal-600" size={20} />}
            bgColor="bg-teal-50"
          />
          <StatCard 
            title="إجمالي الكميات" 
            value={custodyItems.reduce((sum, i) => sum + i.quantity, 0)}
            icon={<ArrowDownCircle className="text-green-600" size={20} />}
            bgColor="bg-green-50"
          />
        </div>
      )}

            {/* Stats for Maintenance view */}
      {activeView === "maintenance" && (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <StatCard 
            title="إجمالي بنود الصيانة" 
            value={totalMaintenanceItems} 
            icon={<Wrench className="text-red-600" size={20} />}
            bgColor="bg-red-50"
          />
          <StatCard 
            title="عدد طلبات الصيانة النشطة" 
            value={new Set(maintenanceItems.map(i => i.maintenance.maintenanceNumber)).size}
            icon={<Package className="text-blue-600" size={20} />}
            bgColor="bg-blue-50"
          />
          <StatCard 
            title="إجمالي الكميات" 
            value={maintenanceItems.reduce((sum, i) => sum + i.quantity, 0)}
            icon={<ArrowDownCircle className="text-green-600" size={20} />}
            bgColor="bg-green-50"
          />
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form className="relative flex-1 max-w-md">
          <input type="hidden" name="view" value={activeView} />
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            name="search" 
            defaultValue={searchQuery}
            placeholder={
                  activeView === "warehouse" ? "ابحث بالاسم أو رمز المنتج..." :
                  activeView === "deposits" ? "ابحث بالمنتج أو اسم المستلم..." :
                  activeView === "custodies" ? "ابحث بالمنتج أو اسم الموظف..." :
                  activeView === "maintenance" ? "ابحث بالمنتج، رقم الصيانة، أو اسم العميل" : "بحث"
            }
            className="w-full rounded-lg border border-gray-300 py-2 pr-10 pl-3 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]" 
          />
        </form>
        {activeView === "warehouse" && (
          <select 
            name="stock" 
            defaultValue={stockFilter || ""}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]"
          >
            <option value="">كل المستويات</option>
            <option value="low">منخفض (1-10)</option>
            <option value="out">نفذ من المخزون</option>
          </select>
        )}
      </div>

      {/* ✅ WAREHOUSE VIEW */}
      {activeView === "warehouse" && (
        <>
          {/* Products Table */}
          <section className="rounded-lg border bg-white shadow-sm overflow-hidden">
            <div className="border-b bg-gray-50 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#061228] flex items-center gap-2">
                <Package size={20} className="text-blue-600" />
                منتجات الكتالوج
              </h2>
              <span className="text-sm text-gray-500">{filteredProducts.length} منتج</span>
            </div>
            
            <div className="overflow-x-auto force-ltr">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">المنتج</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الفئة</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الكمية</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">آخر حركة</th>
                    {permissions?.canManageWarehouse && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">إجراءات</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={permissions?.canManageWarehouse ? 7 : 6} className="px-6 py-8 text-center text-sm text-gray-500">
                        لا توجد منتجات مطابقة.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => {
                      const lastMovement = product.stockMovements[0]
                      return (
                        <tr key={product.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link href={`/products/${product.id}`} className="text-sm font-medium text-gray-900 hover:text-[#dda322] transition">
                              {product.name}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sku}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category || "—"}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            {product.currentStock} {product.unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <StockBadge quantity={product.currentStock} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {lastMovement ? (
                              <div className="flex items-center gap-1">
                                {lastMovement.type === "STOCK_IN" ? 
                                  <ArrowDownCircle size={14} className="text-green-600" /> : 
                                  <ArrowUpCircle size={14} className="text-red-600" />
                                }
                                <span>{lastMovement.createdAt.toLocaleDateString('ar-EG')}</span>
                              </div>
                            ) : "—"}
                          </td>
                          {permissions?.canManageWarehouse && (
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              <WarehouseStockForm 
                                itemId={product.id}
                                itemName={product.name}
                                currentStock={product.currentStock}
                                type="product"
                              />
                            </td>
                          )}
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Custom Items Table */}
          <section className="rounded-lg border bg-white shadow-sm overflow-hidden">
            <div className="border-b bg-gray-50 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#061228] flex items-center gap-2">
                <Boxes size={20} className="text-purple-600" />
                البنود المخصصة (مشاريع)
              </h2>
              <span className="text-sm text-gray-500">{filteredCustomItems.length} بند</span>
            </div>
            
            <div className="overflow-x-auto force-ltr">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">اسم البند</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الوحدة</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الكمية</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">آخر حركة</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ملاحظات</th>
                    {permissions?.canManageWarehouse && (
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">إجراءات</th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomItems.length === 0 ? (
                    <tr>
                      <td colSpan={permissions?.canManageWarehouse ? 7 : 6} className="px-6 py-8 text-center text-sm text-gray-500">
                        لا توجد بنود مخصصة.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomItems.map((item) => {
                      const lastMovement = item.movements[0]
                      return (
                        <tr key={item.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900">{item.name}</span>
                              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-800">
                                مخصص
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.unit}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <StockBadge quantity={item.quantity} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {lastMovement ? (
                              <div className="flex items-center gap-1">
                                {lastMovement.type === "IN" ? 
                                  <ArrowDownCircle size={14} className="text-green-600" /> : 
                                  <ArrowUpCircle size={14} className="text-red-600" />
                                }
                                <span>{lastMovement.createdAt.toLocaleDateString('ar-EG')}</span>
                              </div>
                            ) : "—"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={item.notes || ""}>
                            {item.notes || "—"}
                          </td>
                          {permissions?.canManageWarehouse && (
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              <WarehouseStockForm 
                                itemId={item.id}
                                itemName={item.name}
                                currentStock={item.quantity}
                                type="custom"
                              />
                            </td>
                          )}
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* ✅ DEPOSITS VIEW */}
      {activeView === "deposits" && (
        <section className="rounded-lg border bg-white shadow-sm overflow-hidden">
          <div className="border-b bg-gray-50 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#061228] flex items-center gap-2">
              <Boxes size={20} className="text-purple-600" />
              المنتجات في الأمانات
            </h2>
            <span className="text-sm text-gray-500">{filteredDeposits.length} بند</span>
          </div>
          
          <div className="overflow-x-auto force-ltr">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">اسم المستلم / الوديعة</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">المنتج</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الكمية</th>
                  {permissions?.canManageWarehouse && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">إجراءات</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDeposits.length === 0 ? (
                  <tr>
                    <td colSpan={permissions?.canManageWarehouse ? 5 : 4} className="px-6 py-8 text-center text-sm text-gray-500">
                      لا توجد منتجات في الأمانات.
                    </td>
                  </tr>
                ) : (
                  filteredDeposits.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-3 py-1 text-sm font-semibold text-purple-800">
                          <Boxes size={14} />
                          {item.deposit.recipientName}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <Link href={`/products/${item.product.id}`} className="hover:text-[#dda322] transition">
                          {item.product.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.product.sku}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {item.quantity} {item.product.unit}
                      </td>
                      {permissions?.canManageWarehouse && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <ReturnToWarehouseButton
                            type="deposit"
                            itemId={item.id}
                            productId={item.product.id}
                            itemName={item.product.name}
                            locationName={item.deposit.recipientName}
                            currentQuantity={item.quantity}
                            unit={item.product.unit}
                          />
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ✅ CUSTODIES VIEW */}
      {activeView === "custodies" && (
        <section className="rounded-lg border bg-white shadow-sm overflow-hidden">
          <div className="border-b bg-gray-50 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#061228] flex items-center gap-2">
              <Users size={20} className="text-orange-600" />
              المنتجات في العهد
            </h2>
            <span className="text-sm text-gray-500">{filteredCustodies.length} عهد</span>
          </div>
          
          <div className="overflow-x-auto force-ltr">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الموظف</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">المنتج</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الكمية</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ العهدة</th>
                  {permissions?.canManageWarehouse && (
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">إجراءات</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustodies.length === 0 ? (
                  <tr>
                    <td colSpan={permissions?.canManageWarehouse ? 6 : 5} className="px-6 py-8 text-center text-sm text-gray-500">
                      لا توجد عهد مسجلة.
                    </td>
                  </tr>
                ) : (
                  filteredCustodies.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                            <UserCheck size={14} className="text-orange-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {item.custody.employee.firstName} {item.custody.employee.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <Link href={`/products/${item.product.id}`} className="hover:text-[#dda322] transition">
                          {item.product.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.product.sku}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {item.quantity} {item.product.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>{new Date(item.custody.date).toLocaleDateString('ar-EG')}</span>
                        </div>
                      </td>
                      {permissions?.canManageWarehouse && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <ReturnToWarehouseButton
                            type="custody"
                            itemId={item.id}
                            productId={item.product.id}
                            itemName={item.product.name}
                            locationName={`${item.custody.employee.firstName} ${item.custody.employee.lastName}`}
                            currentQuantity={item.quantity}
                            unit={item.product.unit}
                          />
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

            {/* ✅ MAINTENANCE VIEW */}
      {activeView === "maintenance" && (
        <section className="rounded-lg border bg-white shadow-sm overflow-hidden">
          <div className="border-b bg-gray-50 px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#061228] flex items-center gap-2">
              <Wrench size={20} className="text-red-600" />
              المنتجات قيد الصيانة
            </h2>
            <span className="text-sm text-gray-500">{filteredMaintenance.length} بند</span>
          </div>
          
          <div className="overflow-x-auto force-ltr">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">رقم الصيانة</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">العميل</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">المنتج</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الرقم التسلسلي</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الكمية</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMaintenance.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                      لا توجد منتجات قيد الصيانة حالياً.
                    </td>
                  </tr>
                ) : (
                  filteredMaintenance.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-[#dda322]">
                        {item.maintenance.maintenanceNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.maintenance.customer?.name || "غير محدد"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <Link href={`/products/${item.product.id}`} className="hover:text-[#dda322] transition">
                          {item.product.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                        {item.serialNumber?.serialNumber || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        {item.quantity} {item.product.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800">
                          {item.status === "RECEIVED" ? "تم الاستلام" : 
                           item.status === "UNDER_REPAIR" ? "قيد الإصلاح" :
                           item.status === "WAITING_PARTS" ? "بانتظار قطع الغيار" :
                           item.status === "COMPLETED" ? "مكتمل" : item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

function TabButton({ href, label, count, icon, active }: { 
  href: string; 
  label: string; 
  count: number;
  icon: React.ReactNode;
  active: boolean 
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition border-b-2 ${
        active 
          ? "border-[#dda322] bg-white text-[#061228] shadow-sm" 
          : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
      }`}
    >
      {icon}
      {label}
      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
        active ? "bg-[#dda322] text-white" : "bg-gray-200 text-gray-700"
      }`}>
        {count}
      </span>
    </Link>
  )
}

function StatCard({ title, value, icon, bgColor, valueColor = "text-[#061228]" }: any) {
  return (
    <div className={`rounded-lg border bg-white p-4 shadow-sm ${bgColor}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        {icon}
      </div>
      <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  )
}

function StockBadge({ quantity }: { quantity: number }) {
  if (quantity === 0) {
    return <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">نفذ</span>
  }
  if (quantity <= 10) {
    return <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">منخفض</span>
  }
  return <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">متوفر</span>
}