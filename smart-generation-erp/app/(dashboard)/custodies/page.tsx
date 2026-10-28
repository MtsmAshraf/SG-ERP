import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import Link from "next/link"
import { RotateCcw, DollarSign } from "lucide-react"
import { getCurrencySymbol } from "@/lib/settings"

export default async function CustodiesPage() {
  await requirePermission("canViewCustodies")
  const currency = await getCurrencySymbol()

  const custodies = await prisma.custody.findMany({
    orderBy: { createdAt: "desc" },
    include: { 
      items: { include: { product: true } },
      employee: true
    }
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "BORROWED": return "bg-yellow-100 text-yellow-800"
      case "SOLD": return "bg-green-100 text-green-800"
      case "RETURNED": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "BORROWED": return "تحت العهدة"
      case "SOLD": return "مباع"
      case "RETURNED": return "مُرتجع"
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#061228]">بيانات العهدة</h1>
          <p className="mt-1 text-sm text-gray-500">تتبع المنتجات المسلمة كعهدة للموظفين خارج الشركة.</p>
        </div>
        <Link href="/custodies/new" className="inline-flex justify-center items-center px-4 py-2 bg-[#dda322] text-white rounded-lg hover:bg-[#b8861b] transition font-medium shadow-sm">
          + تسجيل عهدة جديدة
        </Link>
      </div>

      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto force-ltr">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الموظف</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">المنتج</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الكمية</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">القيمة المحتسبة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {custodies.flatMap(c => c.items.map(item => ({ ...item, custody: c }))).map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.custody.employee.firstName} {item.custody.employee.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{item.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.custody.date.toLocaleDateString('ar-EG')}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
                      {getStatusText(item.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.status === "SOLD" && item.soldCostPrice ? `${currency} ${(item.soldCostPrice.toNumber() * item.quantity).toFixed(2)}` : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {item.status === "BORROWED" && (
                      <div className="flex items-center justify-end gap-2">
                        <form action={async (fd) => {
                          "use server"
                          const { sellCustodyItem } = await import("./actions")
                          await sellCustodyItem(fd)
                        }}>
                          <input type="hidden" name="itemId" value={item.id} />
                          <button type="submit" className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 transition" title="تسجيل كبيع">
                            <DollarSign size={18} />
                          </button>
                        </form>
                        <form action={async (fd) => {
                          "use server"
                          const { returnCustodyItem } = await import("./actions")
                          await returnCustodyItem(fd)
                        }}>
                          <input type="hidden" name="itemId" value={item.id} />
                          <button type="submit" className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition" title="إرجاع للمخزن">
                            <RotateCcw size={18} />
                          </button>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {custodies.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">لا توجد سجلات عهدة حالياً.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}