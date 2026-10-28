"use server"

import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createDepartment(prevState: any, formData: FormData) {
  await requirePermission("canManageEmployees")
  
  const name = formData.get("name") as string

  try {
    await prisma.department.create({
      data: { name }
    })
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "هذا القسم موجود بالفعل. يرجى استخدام اسم مختلف." }
    }
    return { error: "حدث خطأ غير متوقع أثناء حفظ القسم." }
  }

  revalidatePath("/hr/departments")
  redirect("/hr/departments")
}

export async function deleteDepartment(formData: FormData) {
  await requirePermission("canManageEmployees")
  const departmentId = formData.get("departmentId") as string

  const employeeCount = await prisma.employee.count({ where: { departmentId } })
  if (employeeCount > 0) {
    throw new Error("لا يمكن حذف هذا القسم لأنه يحتوي على موظفين.")
  }

  await prisma.department.delete({ where: { id: departmentId } })
  revalidatePath("/hr/departments")
}