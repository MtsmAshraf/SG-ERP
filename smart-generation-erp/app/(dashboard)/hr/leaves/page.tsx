import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import Link from "next/link"
import { CheckCircle2, XCircle, Clock } from "lucide-react"
import { ApproveRejectButtons } from "./ApproveRejectButtons"

export default async function LeavesPage() {
  await requirePermission("canViewHR")

  const leaves = await prisma.leave.findMany({
    orderBy: { createdAt: "desc" },
    include: { employee: true }
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800"
      case "APPROVED": return "bg-green-100 text-green-800"
      case "REJECTED": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "PENDING": return "قيد الانتظار"
      case "APPROVED": return "معتمدة"
      case "REJECTED": return "مرفوضة"
      default: return status
    }
  }

  const getLeaveTypeText = (type: string) => {
    switch (type) {
      case "ANNUAL": return "سنوية"
      case "SICK": return "مرضية"
      case "UNPAID": return "بدون راتب"
      case "EMERGENCY": return "طارئة"
      default: return type
    }
  }

  const calculateDays = (start: Date, end: Date) => {
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#061228]">إدارة الإجازات</h1>
          <p className="mt-1 text-sm text-gray-500">متابعة واعتماد طلبات إجازات الموظفين.</p>
        </div>
        <Link href="/hr/leaves/new" className="inline-flex justify-center items-center px-4 py-2 bg-[#dda322] text-white rounded-lg hover:bg-[#b8861b] transition font-medium shadow-sm">
          + طلب إجازة جديد
        </Link>
      </div>

      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto force-ltr">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الموظف</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">النوع</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">من</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">إلى</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الأيام</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaves.map((leave) => (
                <tr key={leave.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{leave.employee.firstName} {leave.employee.lastName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getLeaveTypeText(leave.type)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{leave.startDate.toLocaleDateString('ar-EG')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{leave.endDate.toLocaleDateString('ar-EG')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{calculateDays(leave.startDate, leave.endDate)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(leave.status)}`}>
                      {getStatusText(leave.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {leave.status === "PENDING" && (
                      <ApproveRejectButtons leaveId={leave.id} />
                    )}
                  </td>
                </tr>
              ))}
              {leaves.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">لا توجد طلبات إجازة حالياً.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}