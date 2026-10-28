import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import { generatePayslip } from "../actions"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import GeneratePayslipForm from "./GeneratePayslipForm"

export default async function GeneratePayslipPage() {
  await requirePermission("canManagePayroll")
  
  const employeesRaw = await prisma.employee.findMany({ 
    where: { status: "ACTIVE" },
    orderBy: { firstName: "asc" } 
  })

  // Convert Prisma Decimal objects to plain JavaScript numbers
  const employees = employeesRaw.map(emp => ({
    ...emp,
    basicSalary: emp.basicSalary.toNumber()
  }))
  
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/hr/payroll" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#dda322] transition mb-2">
          <ArrowRight size={16} /> العودة إلى الرواتب
        </Link>
        <h1 className="text-2xl font-bold text-[#061228]">إنشاء كشف راتب جديد</h1>
        <p className="mt-1 text-sm text-gray-500">حدد الموظف والشهر لإنشاء كشف الراتب الشهري.</p>
      </div>
      
      <GeneratePayslipForm employees={employees} />
    </div>
  )
}