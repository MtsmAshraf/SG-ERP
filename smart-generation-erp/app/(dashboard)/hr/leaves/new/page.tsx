import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import { createLeave } from "../actions"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import NewLeaveForm from "./NewLeaveForm"

export default async function NewLeavePage() {
  await requirePermission("canManageLeaves")
  
    const employees = await prisma.employee.findMany({ 
    where: { status: "ACTIVE" },
    orderBy: { firstName: "asc" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
    }
  })
  
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/hr/leaves" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#dda322] transition mb-2">
          <ArrowRight size={16} /> العودة إلى الإجازات
        </Link>
        <h1 className="text-2xl font-bold text-[#061228]">طلب إجازة جديد</h1>
        <p className="mt-1 text-sm text-gray-500">أدخل تفاصيل الإجازة للموظف.</p>
      </div>
      
      <NewLeaveForm employees={employees} />
    </div>
  )
}