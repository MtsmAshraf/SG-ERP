import { prisma } from "@/lib/prisma"
import { getUserPermissions, requirePermission } from "@/lib/auth-utils"
import Link from "next/link"
import { Eye, Pencil, Trash2 } from "lucide-react"
import { DeleteEmployeeButton } from "../../employees/DeleteEmployeeButton"

export default async function EmployeesPage() {

  await requirePermission("canViewHR")
  const permissions = await getUserPermissions()

  const employees = await prisma.employee.findMany({
    orderBy: { createdAt: "desc" },
    include: { department: true }
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-100 text-green-800"
      case "ON_LEAVE": return "bg-yellow-100 text-yellow-800"
      case "TERMINATED": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "ACTIVE": return "نشط"
      case "ON_LEAVE": return "في إجازة"
      case "TERMINATED": return "منهي الخدمة"
      default: return status
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#061228]">إدارة الموظفين</h1>
          <p className="mt-1 text-sm text-gray-500">عرض وإدارة بيانات الموظفين وعقودهم.</p>
        </div>
        <Link href="/hr/employees/new" className="inline-flex justify-center items-center px-4 py-2 bg-[#dda322] text-white rounded-lg hover:bg-[#b8861b] transition font-medium shadow-sm">
          + إضافة موظف جديد
        </Link>
      </div>

      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto force-ltr">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الاسم</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">المسمى الوظيفي</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">القسم</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ التعيين</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الراتب الأساسي</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{emp.firstName} {emp.lastName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.jobTitle}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.department?.name || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.hireDate.toLocaleDateString('ar-EG')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">${emp.basicSalary.toNumber().toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(emp.status)}`}>
                      {getStatusText(emp.status)}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/employees/${emp.id}`} className="text-[#061228] hover:text-[#dda322] p-1 rounded hover:bg-gray-100 transition" title="عرض التفاصيل">
                        <Eye size={18} />
                      </Link>
                      {permissions?.canEditEmployees && (
                        <Link href={`/employees/${emp.id}/edit`} className="text-[#dda322] hover:text-[#b8861b] p-1 rounded hover:bg-[#dda322]/10 transition" title="تعديل">
                          <Pencil size={18} />
                        </Link>
                      )}
                      {permissions?.canDeleteEmployees && <DeleteEmployeeButton employeeId={emp.id} employeeName={`${emp.firstName} ${emp.lastName}`} />}
                    </div>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-500">لا يوجد موظفون حالياً.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}