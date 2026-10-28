"use server"

import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createLeave(prevState: any, formData: FormData) {
  await requirePermission("canManageLeaves")
  
  try {
    const startDate = new Date(formData.get("startDate") as string)
    const endDate = new Date(formData.get("endDate") as string)
    
    if (endDate < startDate) {
      return { error: "تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء." }
    }

    await prisma.leave.create({
      data: {
        employeeId: formData.get("employeeId") as string,
        type: formData.get("type") as any,
        startDate,
        endDate,
        reason: (formData.get("reason") as string) || null,
        status: "PENDING",
      }
    })
  } catch (error: any) {
    return { error: "حدث خطأ غير متوقع أثناء حفظ طلب الإجازة." }
  }

  revalidatePath("/hr/leaves")
  redirect("/hr/leaves")
}

export async function approveLeave(formData: FormData) {
  await requirePermission("canManageLeaves")
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const leaveId = formData.get("leaveId") as string

  await prisma.leave.update({
    where: { id: leaveId },
    data: { 
      status: "APPROVED",
      approvedById: session.user.id
    }
  })

  revalidatePath("/hr/leaves")
}

export async function rejectLeave(formData: FormData) {
  await requirePermission("canManageLeaves")
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const leaveId = formData.get("leaveId") as string

  await prisma.leave.update({
    where: { id: leaveId },
    data: { 
      status: "REJECTED",
      approvedById: session.user.id
    }
  })

  revalidatePath("/hr/leaves")
}