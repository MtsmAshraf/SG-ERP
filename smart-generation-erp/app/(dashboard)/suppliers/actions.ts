"use server"

import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { logActivity } from "@/lib/activity-log"

export async function createSupplier(formData: FormData) {
  const session = await auth()
  if (!session) throw new Error("غير مصرح لك بالوصول.")
  await requirePermission("canCreateSuppliers")

  const name = formData.get("name") as string
  const email = (formData.get("email") as string) || undefined
  const phone = (formData.get("phone") as string) || undefined
  const address = (formData.get("address") as string) || undefined

  const supplier = await prisma.supplier.create({ data: { name, email, phone, address } })

  await logActivity({
    userId: session.user.id,
    action: "CREATE",
    entityType: "Supplier",
    entityId: supplier.id,
    entityName: name,
    details: "تم إنشاء مورد جديد",
  })

  revalidatePath("/suppliers")
  redirect("/suppliers")
}

export async function updateSupplier(formData: FormData) {
  const session = await auth()
  if (!session) throw new Error("غير مصرح لك بالوصول.")
  await requirePermission("canEditSuppliers")

  const supplierId = formData.get("id") as string
  const name = formData.get("name") as string
  const email = (formData.get("email") as string) || undefined
  const phone = (formData.get("phone") as string) || undefined
  const address = (formData.get("address") as string) || undefined

  await prisma.supplier.update({
    where: { id: supplierId },
    data: { name, email, phone, address }
  })

  await logActivity({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "Supplier",
    entityId: supplierId,
    entityName: name,
    details: "تم تحديث بيانات المورد",
  })

  revalidatePath("/suppliers")
  redirect("/suppliers")
}

export async function deleteSupplier(formData: FormData) {
  const session = await auth()
  if (!session) throw new Error("غير مصرح لك بالوصول.")
  await requirePermission("canDeleteSuppliers")

  const supplierId = formData.get("supplierId") as string
  const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } })

  if (!supplier) throw new Error("المورد غير موجود")

  const poCount = await prisma.purchaseOrder.count({ where: { supplierId } })
  if (poCount > 0) throw new Error("لا يمكن حذف هذا المورد. له أوامر شراء مرتبطة.")

  await prisma.supplier.delete({ where: { id: supplierId } })

  await logActivity({
    userId: session.user.id,
    action: "DELETE",
    entityType: "Supplier",
    entityId: supplierId,
    entityName: supplier.name,
    details: "تم حذف المورد",
  })

  revalidatePath("/suppliers")
}