import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import EditEmployeeForm from "./EditEmployeeForm"

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("canEditEmployees")
  const { id } = await params

  const [employee, departments] = await Promise.all([
    prisma.employee.findUnique({ where: { id } }),
    prisma.department.findMany({ orderBy: { name: "asc" } })
  ])

  if (!employee) notFound()

  const employeeData = {
    ...employee,
    basicSalary: employee.basicSalary.toNumber(),
    hireDate: employee.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : ""
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href={`/employees/${id}`} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#dda322] transition mb-2">
          <ArrowRight size={16} /> العودة إلى تفاصيل الموظف
        </Link>
        <h1 className="text-2xl font-bold text-[#061228]">تعديل بيانات الموظف</h1>
        <p className="mt-1 text-sm text-gray-500">تحديث المعلومات الشخصية والوظيفية.</p>
      </div>
      <EditEmployeeForm employee={employeeData} departments={departments} />
    </div>
  )
}