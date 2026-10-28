import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import { createEmployee } from "../actions"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import NewEmployeeForm from "./NewEmployeeForm"

export default async function NewEmployeePage() {
  await requirePermission("canManageEmployees")
  
  const departments = await prisma.department.findMany({ orderBy: { name: "asc" } })

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/hr/employees" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#dda322] transition mb-2">
          <ArrowRight size={16} /> العودة إلى الموظفين
        </Link>
        <h1 className="text-2xl font-bold text-[#061228]">إضافة موظف جديد</h1>
        <p className="mt-1 text-sm text-gray-500">أدخل البيانات الشخصية والوظيفية للموظف الجديد.</p>
      </div>
      
      <NewEmployeeForm departments={departments} />
    </div>
  )
}