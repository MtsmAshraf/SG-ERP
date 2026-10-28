import { prisma } from "@/lib/prisma"
import { requirePermission, getUserPermissions } from "@/lib/auth-utils"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Pencil, User, Mail, Phone, Calendar, Building2, Briefcase, Wallet } from "lucide-react"
import { DeleteEmployeeButton } from "../DeleteEmployeeButton"

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("canViewEmployees")
  const permissions = await getUserPermissions()
  const { id } = await params

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { department: true }
  })

  if (!employee) notFound()

  const statusColors = {
    ACTIVE: "bg-green-100 text-green-800",
    ON_LEAVE: "bg-yellow-100 text-yellow-800",
    TERMINATED: "bg-red-100 text-red-800",
  }
  const statusLabels = {
    ACTIVE: "نشط",
    ON_LEAVE: "في إجازة",
    TERMINATED: "منهي الخدمة",
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href="/employees" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#dda322] transition mb-2">
            <ArrowRight size={16} /> العودة إلى الموظفين
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#dda322]/10">
              <User className="text-[#dda322]" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#061228]">{employee.firstName} {employee.lastName}</h1>
              <p className="text-sm text-gray-500">{employee.jobTitle || "بدون مسمى وظيفي"}</p>
            </div>
          </div>
        </div>

        {(permissions?.canEditEmployees || permissions?.canDeleteEmployees) && (
          <div className="flex items-center gap-2">
            {permissions?.canEditEmployees && (
              <Link href={`/employees/${employee.id}/edit`} className="inline-flex items-center gap-2 rounded-lg bg-[#dda322] px-4 py-2 text-sm font-medium text-white hover:bg-[#b8861b] transition shadow-sm">
                <Pencil size={16} /> تعديل البيانات
              </Link>
            )}
            {permissions?.canDeleteEmployees && <DeleteEmployeeButton employeeId={employee.id} employeeName={`${employee.firstName} ${employee.lastName}`} />}
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2"><Mail size={16} className="text-blue-600" /> معلومات التواصل</h3>
          <div className="space-y-2">
            {employee.email ? <a href={`mailto:${employee.email}`} className="flex items-center gap-2 text-gray-900 hover:text-[#dda322] transition">{employee.email}</a> : <p className="text-gray-400 italic">لا يوجد بريد إلكتروني</p>}
            {employee.phone ? <a href={`tel:${employee.phone}`} className="flex items-center gap-2 text-gray-900 hover:text-[#dda322] transition" dir="ltr">{employee.phone}</a> : <p className="text-gray-400 italic">لا يوجد رقم هاتف</p>}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2"><Building2 size={16} className="text-purple-600" /> القسم والوظيفة</h3>
          <p className="text-lg font-semibold text-[#061228]">{employee.department?.name || "غير محدد"}</p>
          <p className="text-sm text-gray-600 mt-1">{employee.jobTitle || "غير محدد"}</p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2"><Wallet size={16} className="text-green-600" /> الراتب والحالة</h3>
          <p className="text-2xl font-bold text-[#061228]">{employee.basicSalary.toNumber().toFixed(2)} EGP</p>
          <span className={`inline-block mt-2 rounded-full px-3 py-1 text-xs font-semibold ${statusColors[employee.status]}`}>
            {statusLabels[employee.status]}
          </span>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm md:col-span-2 lg:col-span-3">
          <h3 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2"><Calendar size={16} className="text-amber-600" /> تاريخ التعيين</h3>
          <p className="text-lg font-semibold text-[#061228]">
            {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) : "غير محدد"}
          </p>
        </div>
      </div>
    </div>
  )
}