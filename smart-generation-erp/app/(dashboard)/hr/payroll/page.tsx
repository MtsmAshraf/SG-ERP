import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import Link from "next/link"
import { MarkAsPaidButton } from "./MarkAsPaidButton"
import { getCurrencySymbol } from "@/lib/settings"

export default async function PayrollPage() {
  await requirePermission("canViewHR")
  const currency = await getCurrencySymbol()

  const payslips = await prisma.payslip.findMany({
    orderBy: { createdAt: "desc" },
    include: { employee: true }
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "DRAFT": return "bg-yellow-100 text-yellow-800"
      case "PAID": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "DRAFT": return "مسودة"
      case "PAID": return "مدفوع"
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#061228]">إدارة الرواتب</h1>
          <p className="mt-1 text-sm text-gray-500">إنشاء ومتابعة كشوف رواتب الموظفين الشهرية.</p>
        </div>
        <Link href="/hr/payroll/generate" className="inline-flex justify-center items-center px-4 py-2 bg-[#dda322] text-white rounded-lg hover:bg-[#b8861b] transition font-medium shadow-sm">
          + إنشاء كشف راتب جديد
        </Link>
      </div>

      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto force-ltr">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الموظف</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الشهر</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الراتب الأساسي</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">البدلات</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الخصومات</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">صافي الراتب</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payslips.map((slip) => (
                <tr key={slip.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{slip.employee.firstName} {slip.employee.lastName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{slip.month.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' })}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{currency} {slip.basicSalary.toNumber().toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">+{currency} {slip.bonuses.toNumber().toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">-{currency} {slip.deductions.toNumber().toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{currency} {slip.netSalary.toNumber().toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(slip.status)}`}>
                      {getStatusText(slip.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {slip.status === "DRAFT" && (
                      <MarkAsPaidButton payslipId={slip.id} />
                    )}
                  </td>
                </tr>
              ))}
              {payslips.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500">لا توجد كشوف رواتب حالياً.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}