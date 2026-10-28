"use server"

import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function generatePayslip(prevState: any, formData: FormData) {
  await requirePermission("canManagePayroll")
  
  try {
    const employeeId = formData.get("employeeId") as string
    const monthStr = formData.get("month") as string // Format: YYYY-MM
    const bonuses = parseFloat(formData.get("bonuses") as string) || 0
    const deductions = parseFloat(formData.get("deductions") as string) || 0

    // 1. Fetch Employee
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } })
    if (!employee) return { error: "الموظف غير موجود." }

    // 2. Check if payslip already exists for this month
    const monthDate = new Date(`${monthStr}-01`)
    const existingPayslip = await prisma.payslip.findFirst({
      where: { 
        employeeId, 
        month: monthDate 
      }
    })

    if (existingPayslip) {
      return { error: "تم إنشاء كشف راتب لهذا الموظف في هذا الشهر بالفعل." }
    }

    // 3. Calculate Net Salary
    const basicSalary = employee.basicSalary.toNumber()
    const netSalary = basicSalary + bonuses - deductions

    // 4. Save Payslip
    await prisma.payslip.create({
      data: {
        employeeId,
        month: monthDate,
        basicSalary,
        bonuses,
        deductions,
        netSalary,
        status: "DRAFT",
      }
    })

  } catch (error: any) {
    return { error: "حدث خطأ غير متوقع أثناء إنشاء كشف الراتب." }
  }

  revalidatePath("/hr/payroll")
  redirect("/hr/payroll")
}

export async function markAsPaid(formData: FormData) {
  await requirePermission("canManagePayroll")
  const payslipId = formData.get("payslipId") as string

  await prisma.payslip.update({
    where: { id: payslipId },
    data: { 
      status: "PAID",
      paidAt: new Date()
    }
  })

  revalidatePath("/hr/payroll")
}