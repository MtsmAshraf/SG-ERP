import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import Link from "next/link"
import { Building2, Users, Calendar, Banknote, ArrowRight } from "lucide-react"

export default async function HRPage() {
  await requirePermission("canViewHR")

  // Fetch quick stats
  const [totalEmployees, activeEmployees, totalDepartments] = await Promise.all([
    prisma.employee.count(),
    prisma.employee.count({ where: { status: "ACTIVE" } }),
    prisma.department.count(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#061228]">الموارد البشرية</h1>
        <p className="mt-1 text-sm text-gray-500">إدارة الموظفين، الأقسام، الإجازات، والرواتب.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">إجمالي الموظفين</p>
            <div className="rounded-full bg-blue-100 p-2">
              <Users className="text-blue-600" size={20} />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-[#061228]">{totalEmployees}</p>
        </div>
        
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">الموظفون النشطون</p>
            <div className="rounded-full bg-green-100 p-2">
              <Users className="text-green-600" size={20} />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-[#061228]">{activeEmployees}</p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">الأقسام</p>
            <div className="rounded-full bg-purple-100 p-2">
              <Building2 className="text-purple-600" size={20} />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold text-[#061228]">{totalDepartments}</p>
        </div>
      </div>

      {/* HR Modules Grid */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/hr/departments" className="group block rounded-lg border bg-white p-6 shadow-sm transition hover:shadow-md hover:border-[#dda322]">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-[#dda322]/10 p-3 text-[#dda322] group-hover:bg-[#dda322] group-hover:text-white transition">
              <Building2 size={24} />
            </div>
            <div>
              <h3 className="font-bold text-[#061228]">الأقسام</h3>
              <p className="text-sm text-gray-500">إدارة هيكلة الشركة</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm font-medium text-[#dda322]">
            عرض الأقسام <ArrowRight size={16} className="mr-1 rotate-180" />
          </div>
        </Link>

        <Link href="/hr/employees" className="group block rounded-lg border bg-white p-6 shadow-sm transition hover:shadow-md hover:border-[#dda322]">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-[#dda322]/10 p-3 text-[#dda322] group-hover:bg-[#dda322] group-hover:text-white transition">
              <Users size={24} />
            </div>
            <div>
              <h3 className="font-bold text-[#061228]">الموظفون</h3>
              <p className="text-sm text-gray-500">بيانات وعقود الموظفين</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm font-medium text-[#dda322]">
            إدارة الموظفين <ArrowRight size={16} className="mr-1 rotate-180" />
          </div>
        </Link>

        <Link href="/hr/leaves" className="group block rounded-lg border bg-white p-6 shadow-sm transition hover:shadow-md hover:border-[#dda322]">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-[#dda322]/10 p-3 text-[#dda322] group-hover:bg-[#dda322] group-hover:text-white transition">
              <Calendar size={24} />
            </div>
            <div>
              <h3 className="font-bold text-[#061228]">الإجازات</h3>
              <p className="text-sm text-gray-500">طلبات وإجازات الموظفين</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm font-medium text-[#dda322]">
            عرض الإجازات <ArrowRight size={16} className="mr-1 rotate-180" />
          </div>
        </Link>

        <Link href="/hr/payroll" className="group block rounded-lg border bg-white p-6 shadow-sm transition hover:shadow-md hover:border-[#dda322]">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-[#dda322]/10 p-3 text-[#dda322] group-hover:bg-[#dda322] group-hover:text-white transition">
              <Banknote size={24} />
            </div>
            <div>
              <h3 className="font-bold text-[#061228]">الرواتب</h3>
              <p className="text-sm text-gray-500">كشوف الرواتب الشهرية</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm font-medium text-[#dda322]">
            إدارة الرواتب <ArrowRight size={16} className="mr-1 rotate-180" />
          </div>
        </Link>
      </div>
    </div>
  )
}