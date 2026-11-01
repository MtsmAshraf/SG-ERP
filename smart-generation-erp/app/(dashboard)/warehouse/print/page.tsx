import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import { notFound } from "next/navigation"
import { Warehouse as WarehouseIcon, Boxes, Users, Package, Wrench } from "lucide-react"
import { PrintActions } from "./PrintActions"

export default async function WarehousePrintPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await requirePermission("canViewWarehouse")
  const params = await searchParams
  const type = (params.type as string) || "all"

  // ✅ 1. Added "maintenance" to the allowed types
  if (!["warehouse", "deposits", "custodies", "maintenance", "all"].includes(type)) {
    notFound()
  }

  // ✅ 2. Fetch data based on type (Added maintenanceItems)
  const [allProducts, customItems, depositItems, custodyItems, maintenanceItems] = await Promise.all([
    type === "warehouse" || type === "all"
      ? prisma.product.findMany({
          orderBy: { name: "asc" },
          where: { currentStock: { gt: 0 } }
        })
      : Promise.resolve([]),
    type === "warehouse" || type === "all"
      ? prisma.warehouseCustomItem.findMany({
          orderBy: { name: "asc" },
          where: { quantity: { gt: 0 } }
        })
      : Promise.resolve([]),
    type === "deposits" || type === "all"
      ? prisma.depositItem.findMany({
          where: { quantity: { gt: 0 } },
          orderBy: [{ deposit: { recipientName: "asc" } }, { product: { name: "asc" } }],
          include: {
            deposit: { select: { recipientName: true } },
            product: { select: { name: true, sku: true, unit: true } }
          }
        })
      : Promise.resolve([]),
    type === "custodies" || type === "all"
      ? prisma.custodyItem.findMany({
          where: { quantity: { gt: 0 } },
          orderBy: { custody: { date: "desc" } },
          include: {
            custody: {
              include: {
                employee: { select: { firstName: true, lastName: true } }
              }
            },
            product: { select: { name: true, sku: true, unit: true } }
          }
        })
      : Promise.resolve([]),
    // ✅ NEW: Fetch maintenance items
    type === "maintenance" || type === "all"
      ? prisma.maintenanceItem.findMany({
          where: { status: { notIn: ["RETURNED", "SCRAPPED"] } },
          orderBy: { maintenance: { receivedDate: "desc" } },
          include: {
            maintenance: { select: { maintenanceNumber: true, customer: { select: { name: true } } } },
            product: { select: { name: true, sku: true, unit: true } },
            serialNumber: { select: { serialNumber: true } }
          }
        })
      : Promise.resolve([])
  ])

  const printDate = new Date().toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })

  return (
    <div className="print-container" dir="rtl">
      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
            font-family: 'Arial', sans-serif;
          }
          .print-container {
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          @page {
            margin: 1cm;
            size: A4;
          }
        }
        @media screen {
          .print-container {
            max-width: 210mm;
            margin: 0 auto;
            background: white;
            padding: 20px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
        }
      `}</style>

      <PrintActions />

      {/* Header */}
      <div className="border-b-2 border-[#061228] pb-4 mb-6">
        <h1 className="text-3xl font-bold text-[#061228] mb-2">
          {type === "warehouse" && "تقرير المخزن الرئيسي"}
          {type === "deposits" && "تقرير الودائع"}
          {type === "custodies" && "تقرير العهد"}
          {type === "maintenance" && "تقرير الصيانة"} {/* ✅ Added */}
          {type === "all" && "تقرير المخزون الشامل"}
        </h1>
        <p className="text-sm text-gray-600">تاريخ الطباعة: {printDate}</p>
      </div>

      {/* Main Warehouse Section */}
      {(type === "warehouse" || type === "all") && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-[#061228] mb-4 flex items-center gap-2 border-b pb-2">
            <WarehouseIcon size={20} className="text-[#dda322]" />
            المخزن الرئيسي - منتجات الكتالوج
          </h2>
          {allProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-4">لا توجد منتجات</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold">المنتج</th>
                  <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold">SKU</th>
                  <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold">الفئة</th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold">الكمية</th>
                </tr>
              </thead>
              <tbody>
                {allProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{product.name}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{product.sku}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{product.category || "—"}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-center font-bold">
                      {product.currentStock} {product.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-bold">
                  <td colSpan={3} className="border border-gray-300 px-3 py-2 text-sm text-right">
                    الإجمالي
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-sm text-center">
                    {allProducts.reduce((sum, p) => sum + p.currentStock, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}

          {customItems.length > 0 && (
            <>
              <h3 className="text-lg font-bold text-[#061228] mt-6 mb-3 flex items-center gap-2">
                <Boxes size={18} className="text-purple-600" />
                البنود المخصصة
              </h3>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold">اسم البند</th>
                    <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold">الوحدة</th>
                    <th className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold">الكمية</th>
                    <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold">ملاحظات</th>
                  </tr>
                </thead>
                <tbody>
                  {customItems.map((item) => (
                    <tr key={item.id}>
                      <td className="border border-gray-300 px-3 py-2 text-sm">{item.name}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm">{item.unit}</td>
                      <td className="border border-gray-300 px-3 py-2 text-sm text-center font-bold">
                        {item.quantity}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 text-sm">{item.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-bold">
                    <td colSpan={2} className="border border-gray-300 px-3 py-2 text-sm text-right">
                      الإجمالي
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-center">
                      {customItems.reduce((sum, i) => sum + i.quantity, 0)}
                    </td>
                    <td className="border border-gray-300 px-3 py-2"></td>
                  </tr>
                </tfoot>
              </table>
            </>
          )}
        </section>
      )}

      {/* Deposits Section */}
      {(type === "deposits" || type === "all") && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-[#061228] mb-4 flex items-center gap-2 border-b pb-2">
            <Boxes size={20} className="text-purple-600" />
            الودائع
          </h2>
          {depositItems.length === 0 ? (
            <p className="text-gray-500 text-center py-4">لا توجد منتجات في الودائع</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold">المستلم / الوديعة</th>
                  <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold">المنتج</th>
                  <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold">SKU</th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold">الكمية</th>
                </tr>
              </thead>
              <tbody>
                {depositItems.map((item) => (
                  <tr key={item.id}>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{item.deposit.recipientName}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{item.product.name}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{item.product.sku}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-center font-bold">
                      {item.quantity} {item.product.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-bold">
                  <td colSpan={3} className="border border-gray-300 px-3 py-2 text-sm text-right">
                    الإجمالي
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-sm text-center">
                    {depositItems.reduce((sum, i) => sum + i.quantity, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </section>
      )}

      {/* Custodies Section */}
      {(type === "custodies" || type === "all") && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-[#061228] mb-4 flex items-center gap-2 border-b pb-2">
            <Users size={20} className="text-orange-600" />
            العهد
          </h2>
          {custodyItems.length === 0 ? (
            <p className="text-gray-500 text-center py-4">لا توجد عهد مسجلة</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold">الموظف</th>
                  <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold">المنتج</th>
                  <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold">SKU</th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold">الكمية</th>
                </tr>
              </thead>
              <tbody>
                {custodyItems.map((item) => (
                  <tr key={item.id}>
                    <td className="border border-gray-300 px-3 py-2 text-sm">
                      {item.custody.employee.firstName} {item.custody.employee.lastName}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{item.product.name}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{item.product.sku}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-center font-bold">
                      {item.quantity} {item.product.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-bold">
                  <td colSpan={3} className="border border-gray-300 px-3 py-2 text-sm text-right">
                    الإجمالي
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-sm text-center">
                    {custodyItems.reduce((sum, i) => sum + i.quantity, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </section>
      )}

      {/* ✅ NEW: Maintenance Section */}
      {(type === "maintenance" || type === "all") && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-[#061228] mb-4 flex items-center gap-2 border-b pb-2">
            <Wrench size={20} className="text-red-600" />
            المنتجات قيد الصيانة
          </h2>
          {maintenanceItems.length === 0 ? (
            <p className="text-gray-500 text-center py-4">لا توجد منتجات قيد الصيانة</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold">رقم الصيانة</th>
                  <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold">العميل</th>
                  <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold">المنتج</th>
                  <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold">الرقم التسلسلي</th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold">الكمية</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceItems.map((item) => (
                  <tr key={item.id}>
                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{item.maintenance.maintenanceNumber}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{item.maintenance.customer?.name || "—"}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{item.product.name}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm font-mono">{item.serialNumber?.serialNumber || "—"}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm text-center font-bold">
                      {item.quantity} {item.product.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-bold">
                  <td colSpan={4} className="border border-gray-300 px-3 py-2 text-sm text-right">
                    الإجمالي
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-sm text-center">
                    {maintenanceItems.reduce((sum, i) => sum + i.quantity, 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </section>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t text-center text-xs text-gray-500">
        <p>تم إنشاء هذا التقرير بواسطة نظام Smart Generation ERP</p>
      </div>
    </div>
  )
}