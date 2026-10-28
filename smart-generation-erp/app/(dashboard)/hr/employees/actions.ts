"use server"

import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { logActivity } from "@/lib/activity-log"

export async function createEmployee(prevState: any, formData: FormData) {
  await requirePermission("canManageEmployees")
  
  try {
    const data = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: (formData.get("email") as string) || null,
      phone: (formData.get("phone") as string) || null,
      jobTitle: formData.get("jobTitle") as string,
      departmentId: (formData.get("departmentId") as string) || null,
      hireDate: new Date(formData.get("hireDate") as string),
      basicSalary: parseFloat(formData.get("basicSalary") as string) || 0,
      status: "ACTIVE" as const,
    }

    await prisma.employee.create({ data })
  } catch (error: any) {
    return { error: "حدث خطأ غير متوقع أثناء حفظ بيانات الموظف." }
  }

  revalidatePath("/hr/employees")
  redirect("/hr/employees")
}


export async function updateEmployee(prevState: any, formData: FormData) {
  try {
    const session = await auth()
    if (!session) return { error: "غير مصرح لك بالوصول." }
    await requirePermission("canEditEmployees")

    const employeeId = formData.get("employeeId") as string
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
    
    const email = (formData.get("email") as string) || undefined
    const phone = (formData.get("phone") as string) || undefined
    const departmentId = (formData.get("departmentId") as string) || undefined
    const jobTitle = (formData.get("jobTitle") as string) || undefined
    
    const hireDateStr = formData.get("hireDate") as string
    // ✅ FIX 2: The schema uses 'basicSalary', not 'baseSalary'
    const basicSalary = parseFloat(formData.get("baseSalary") as string) || 0 
    const status = formData.get("status") as "ACTIVE" | "ON_LEAVE" | "TERMINATED"

    // Build the data object safely
    const updateData: any = {
      firstName,
      lastName,
      email,
      phone,
      jobTitle,
      hireDate: hireDateStr ? new Date(hireDateStr) : undefined,
      basicSalary, // ✅ Use the correct schema field name
      status,
    }

    // ✅ FIX 1: Use the relation 'connect' syntax for the department
    if (departmentId) {
      updateData.department = { connect: { id: departmentId } }
    } else {
      updateData.department = { disconnect: true }
    }

    await prisma.employee.update({
      where: { id: employeeId },
      data: updateData
    })

    await logActivity({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "Employee",
      entityId: employeeId,
      entityName: `${firstName} ${lastName}`,
      details: "تم تحديث بيانات الموظف",
    })
  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") throw error
    console.error("Update employee error:", error)
    return { error: error.message || "فشل تحديث بيانات الموظف" }
  }
  
  revalidatePath("/hr/employees")
  redirect("/hr/employees")
}

export async function deleteEmployee(formData: FormData) {
  const session = await auth()
  if (!session) return
  await requirePermission("canDeleteEmployees")

  const employeeId = formData.get("employeeId") as string
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } })

  const leavesCount = await prisma.leave.count({ where: { employeeId } }).catch(() => 0)
  const custodyCount = await prisma.custody.count({ where: { employeeId } }).catch(() => 0)

  if (leavesCount > 0 || custodyCount > 0) {
    throw new Error("لا يمكن حذف هذا الموظف. له سجلات مرتبطة (إجازات أو عهد).")
  }

  await prisma.employee.delete({ where: { id: employeeId } })

  await logActivity({
    userId: session.user.id,
    action: "DELETE",
    entityType: "Employee",
    entityId: employeeId,
    entityName: employee ? `${employee.firstName} ${employee.lastName}` : "موظف",
  })

  revalidatePath("/hr/employees")
}