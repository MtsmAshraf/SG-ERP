"use server"

import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { logActivity } from "@/lib/activity-log"
import { notifyUsersWithPermission } from "@/lib/notifications"

// Generate unique maintenance number
async function generateMaintenanceNumber(): Promise<string> {
  const count = await prisma.maintenance.count()
  const nextNum = count + 1
  return `MNT-${new Date().getFullYear()}-${nextNum.toString().padStart(4, '0')}`
}

export async function createMaintenance(prevState: any, formData: FormData) {
  try {
    const session = await auth()
    if (!session) return { error: "غير مصرح لك بالوصول." }
    await requirePermission("canManageMaintenance")

    const customerId = (formData.get("customerId") as string) || undefined
    const salesOrderId = (formData.get("salesOrderId") as string) || undefined
    const notes = (formData.get("notes") as string) || undefined
    const expectedCompletionDate = formData.get("expectedCompletionDate") as string

    // Parse items from form (dynamic fields)
    const items: {
      productId: string
      serialNumberId: string | null
      quantity: number
      issueDescription: string
    }[] = []

    let index = 0
    while (formData.get(`productId_${index}`)) {
      const productId = formData.get(`productId_${index}`) as string
      const serialNumberId = (formData.get(`serialNumberId_${index}`) as string) || null
      const quantity = parseInt(formData.get(`quantity_${index}`) as string) || 1
      const issueDescription = (formData.get(`issue_${index}`) as string) || ""

      if (productId) {
        items.push({ productId, serialNumberId, quantity, issueDescription })
      }
      index++
    }

    if (items.length === 0) {
      return { error: "يجب إضافة منتج واحد على الأقل" }
    }

    const maintenanceNumber = await generateMaintenanceNumber()

    const maintenance = await prisma.maintenance.create({
      data: {
        maintenanceNumber,
        customerId: customerId || null,
        salesOrderId: salesOrderId || null,
        notes,
        expectedCompletionDate: expectedCompletionDate ? new Date(expectedCompletionDate) : null,
        status: "RECEIVED",
        createdById: session.user.id,
        items: {
          create: items.map(item => ({
            productId: item.productId,
            serialNumberId: item.serialNumberId,
            quantity: item.quantity,
            issueDescription: item.issueDescription,
            status: "RECEIVED"
          }))
        }
      },
      include: {
        items: { include: { product: true } }
      }
    })

    await notifyUsersWithPermission("canViewMaintenance", {
      type: "SYSTEM",
      title: "طلب صيانة جديد",
      message: `تم استلام طلب صيانة جديد رقم ${maintenanceNumber}`,
      link: `/maintenance/${maintenance.id}`,
      entityType: "Maintenance",
      entityId: maintenance.id,
      actorId: session.user.id,
    })

    await logActivity({
      userId: session.user.id,
      action: "CREATE",
      entityType: "Maintenance",
      entityId: maintenance.id,
      entityName: maintenanceNumber,
      details: `تم إنشاء طلب صيانة جديد يحتوي على ${items.length} منتج`,
    })

  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") throw error
    console.error("Create maintenance error:", error)
    return { error: error.message || "فشل إنشاء طلب الصيانة" }
  }

  revalidatePath("/maintenance")
  redirect("/maintenance")
}

export async function updateMaintenanceStatus(formData: FormData) {
  const session = await auth()
  if (!session) throw new Error("غير مصرح")
  await requirePermission("canManageMaintenance")

  const maintenanceId = formData.get("maintenanceId") as string
  const status = formData.get("status") as string
  const repairNotes = (formData.get("repairNotes") as string) || undefined
  const repairCost = formData.get("repairCost") as string

  const maintenance = await prisma.maintenance.findUnique({
    where: { id: maintenanceId }
  })

  if (!maintenance) throw new Error("طلب الصيانة غير موجود")

  const updateData: any = {
    status: status as any,
    repairNotes: repairNotes || maintenance.repairNotes,
  }

  if (repairCost) {
    updateData.repairCost = parseFloat(repairCost)
  }

  if (status === "COMPLETED") {
    updateData.completedDate = new Date()
  }

  if (status === "RETURNED") {
    updateData.returnedDate = new Date()
  }

  await prisma.maintenance.update({
    where: { id: maintenanceId },
    data: updateData
  })

  // Update all items status to match
  await prisma.maintenanceItem.updateMany({
    where: { maintenanceId },
    data: {
      status: status as any,
      resolvedDate: status === "COMPLETED" || status === "RETURNED" ? new Date() : null
    }
  })

  // Notify customer if we have their ID
  if (maintenance.customerId && status === "COMPLETED") {
    // You could add customer notifications here later
  }

  await notifyUsersWithPermission("canViewMaintenance", {
    type: "SYSTEM",
    title: `تحديث حالة الصيانة ${maintenance.maintenanceNumber}`,
    message: `تم تحديث حالة طلب الصيانة إلى: ${getStatusArabic(status)}`,
    link: `/maintenance/${maintenanceId}`,
    entityType: "Maintenance",
    entityId: maintenanceId,
    actorId: session.user.id,
  })

  await logActivity({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "Maintenance",
    entityId: maintenanceId,
    entityName: maintenance.maintenanceNumber,
    details: `تم تحديث الحالة إلى: ${getStatusArabic(status)}`,
  })

  revalidatePath("/maintenance")
  revalidatePath(`/maintenance/${maintenanceId}`)
}

export async function returnToCustomer(formData: FormData) {
  const session = await auth()
  if (!session) throw new Error("غير مصرح")
  await requirePermission("canManageMaintenance")

  const maintenanceId = formData.get("maintenanceId") as string
  const notes = (formData.get("notes") as string) || undefined

  const maintenance = await prisma.maintenance.findUnique({
    where: { id: maintenanceId },
    include: { customer: true }
  })

  if (!maintenance) throw new Error("طلب الصيانة غير موجود")

  if (maintenance.status !== "COMPLETED") {
    throw new Error("يجب أن تكون الحالة 'مكتمل' قبل الإرجاع")
  }

  await prisma.maintenance.update({
    where: { id: maintenanceId },
    data: {
      status: "RETURNED",
      returnedDate: new Date(),
      repairNotes: notes || maintenance.repairNotes
    }
  })

  await prisma.maintenanceItem.updateMany({
    where: { maintenanceId },
    data: {
      status: "RETURNED",
      resolvedDate: new Date()
    }
  })

  await notifyUsersWithPermission("canViewMaintenance", {
    type: "SYSTEM",
    title: `تم إرجاع الصيانة ${maintenance.maintenanceNumber}`,
    message: `تم إرجاع طلب الصيانة إلى العميل${maintenance.customer ? ` ${maintenance.customer.name}` : ""}`,
    link: `/maintenance/${maintenanceId}`,
    entityType: "Maintenance",
    entityId: maintenanceId,
    actorId: session.user.id,
  })

  await logActivity({
    userId: session.user.id,
    action: "RETURN",
    entityType: "Maintenance",
    entityId: maintenanceId,
    entityName: maintenance.maintenanceNumber,
    details: `تم إرجاع طلب الصيانة إلى العميل`,
  })

  revalidatePath("/maintenance")
  revalidatePath(`/maintenance/${maintenanceId}`)
}

// Helper function
function getStatusArabic(status: string): string {
  const map: Record<string, string> = {
    RECEIVED: "تم الاستلام",
    UNDER_REPAIR: "قيد الإصلاح",
    WAITING_PARTS: "بانتظار قطع الغيار",
    COMPLETED: "مكتمل",
    RETURNED: "تم الإرجاع",
    SCRAPPED: "تم الإتلاف"
  }
  return map[status] || status
}