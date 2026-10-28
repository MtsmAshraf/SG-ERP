import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import Link from "next/link"
import { CheckCircle2, RotateCcw, DollarSign } from "lucide-react"
import { getCurrencySymbol } from "@/lib/settings"

export default async function DepositsPage() {
  await requirePermission("canViewDeposits")
  const currency = await getCurrencySymbol()

  const deposits = await prisma.deposit.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: true } } }
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
      case "BORROWED": return "مُستأمن"
      case "SOLD": return "مباع"
      case "RETURNED": return "مُرتجع"
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#061228]">بيانات الأمانة</h1>
          <p className="mt-1 text-sm text-gray-500">تتبع المنتجات المسلمة كأمانة للشركات أو الأشخاص.</p>
        </div>
        <Link href="/deposits/new" className="inline-flex justify-center items-center px-4 py-2 bg-[#dda322] text-white rounded-lg hover:bg-[#b8861b] transition font-medium shadow-sm">
          + تسجيل أمانة جديدة
        </Link>
      </div>

      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto force-ltr">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">المستلم</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">النوع</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">المنتج</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الكمية</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">القيمة المحتسبة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deposits.flatMap(d => d.items.map(item => ({ ...item, deposit: d }))).map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.deposit.recipientName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.deposit.recipientType === "COMPANY" ? "شركة" : "شخص"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{item.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.deposit.date.toLocaleDateString('ar-EG')}</td>
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
                          const { sellDepositItem } = await import("./actions")
                          await sellDepositItem(fd)
                        }}>
                          <input type="hidden" name="itemId" value={item.id} />
                          <button type="submit" className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 transition" title="تسجيل كبيع">
                            <DollarSign size={18} />
                          </button>
                        </form>
                        <form action={async (fd) => {
                          "use server"
                          const { returnDepositItem } = await import("./actions")
                          await returnDepositItem(fd)
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
              {deposits.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500">لا توجد سجلات أمانة حالياً.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}