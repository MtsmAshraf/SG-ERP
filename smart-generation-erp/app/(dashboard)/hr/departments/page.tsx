import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import Link from "next/link"
import { Trash2, Building2 } from "lucide-react"
import { DeleteDepartmentButton } from "./DeleteDepartmentButton"

export default async function DepartmentsPage() {
  await requirePermission("canViewHR")

  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { employees: true } } }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#061228]">إدارة الأقسام</h1>
          <p className="mt-1 text-sm text-gray-500">إنشاء وإدارة هيكلة أقسام الشركة.</p>
        </div>
        <Link href="/hr/departments/new" className="inline-flex justify-center items-center px-4 py-2 bg-[#dda322] text-white rounded-lg hover:bg-[#b8861b] transition font-medium shadow-sm">
          + إضافة قسم جديد
        </Link>
      </div>

      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto force-ltr">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">اسم القسم</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">عدد الموظفين</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ الإنشاء</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {departments.map((dept) => (
                <tr key={dept.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center gap-2">
                    <Building2 size={16} className="text-[#dda322]" /> {dept.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {dept._count.employees} موظف
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{dept.createdAt.toLocaleDateString('ar-EG')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <DeleteDepartmentButton departmentId={dept.id} departmentName={dept.name} employeeCount={dept._count.employees} />
                  </td>
                </tr>
              ))}
              {departments.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">لا توجد أقسام حالياً.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}