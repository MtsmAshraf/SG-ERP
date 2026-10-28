"use server"

import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { logActivity } from "@/lib/activity-log"

export async function createCustomer(prevState: any, formData: FormData) {
  try {
    const session = await auth()
    if (!session) return { error: "غير مصرح لك بالوصول." }
    await requirePermission("canCreateCustomers")

    const name = formData.get("name") as string
    const email = (formData.get("email") as string) || undefined
    const phone = (formData.get("phone") as string) || undefined
    const address = (formData.get("address") as string) || undefined
    const area = (formData.get("area") as string) || undefined
    const fieldOfWork = (formData.get("fieldOfWork") as string) || undefined
    const defaultPercentage = parseFloat(formData.get("defaultPercentage") as string) || 0

    const contacts: { name: string; jobTitle: string | null; phone: string | null }[] = []
    let index = 0
    while (formData.get(`contactName_${index}`)) {
      const contactName = formData.get(`contactName_${index}`) as string
      const contactTitle = (formData.get(`contactTitle_${index}`) as string) || null
      const contactPhone = (formData.get(`contactPhone_${index}`) as string) || null
      if (contactName.trim()) contacts.push({ name: contactName, jobTitle: contactTitle, phone: contactPhone })
      index++
    }

    const customer = await prisma.customer.create({
      data: { name, email, phone, address, area, fieldOfWork, defaultPercentage, contacts: { create: contacts } }
    })

    await logActivity({
      userId: session.user.id,
      action: "CREATE",
      entityType: "Customer",
      entityId: customer.id,
      entityName: name,
      details: "تم إنشاء عميل جديد",
    })
  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") throw error
    if (error.code === "P2002") return { error: "يوجد عميل بنفس البريد الإلكتروني بالفعل." }
    return { error: error.message || "فشل إنشاء العميل" }
  }
  revalidatePath("/customers")
  redirect("/customers")
}

export async function updateCustomer(prevState: any, formData: FormData) {
  try {
    const session = await auth()
    if (!session) return { error: "غير مصرح لك بالوصول." }
    await requirePermission("canEditCustomers")

    const customerId = formData.get("customerId") as string
    const name = formData.get("name") as string
    const email = (formData.get("email") as string) || undefined
    const phone = (formData.get("phone") as string) || undefined
    const address = (formData.get("address") as string) || undefined
    const area = (formData.get("area") as string) || undefined
    const fieldOfWork = (formData.get("fieldOfWork") as string) || undefined
    const defaultPercentage = parseFloat(formData.get("defaultPercentage") as string) || 0

    const contacts: { name: string; jobTitle: string | null; phone: string | null }[] = []
    let index = 0
    while (formData.get(`contactName_${index}`)) {
      const contactName = formData.get(`contactName_${index}`) as string
      const contactTitle = (formData.get(`contactTitle_${index}`) as string) || null
      const contactPhone = (formData.get(`contactPhone_${index}`) as string) || null
      if (contactName.trim()) contacts.push({ name: contactName, jobTitle: contactTitle, phone: contactPhone })
      index++
    }

    await prisma.$transaction(async (tx) => {
      await tx.customerContact.deleteMany({ where: { customerId } })
      await tx.customer.update({
        where: { id: customerId },
        data: { name, email, phone, address, area, fieldOfWork, defaultPercentage }
      })
      if (contacts.length > 0) {
        await tx.customerContact.createMany({ data: contacts.map(c => ({ ...c, customerId })) })
      }
    })

    await logActivity({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "Customer",
      entityId: customerId,
      entityName: name,
      details: "تم تحديث بيانات العميل",
    })
  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") throw error
    if (error.code === "P2002") return { error: "يوجد عميل بنفس البريد الإلكتروني بالفعل." }
    return { error: error.message || "فشل تحديث العميل" }
  }
  revalidatePath("/customers")
  redirect("/customers")
}

export async function deleteCustomer(formData: FormData) {
  const session = await auth()
  if (!session) return
  await requirePermission("canDeleteCustomers")

  const customerId = formData.get("customerId") as string
  const customer = await prisma.customer.findUnique({ where: { id: customerId } })

  const [ordersCount, offersCount, invoicesCount] = await Promise.all([
    prisma.salesOrder.count({ where: { customerId } }),
    prisma.priceOffer.count({ where: { customerId } }),
    prisma.invoice.count({ where: { customerId } }),
  ])

  if (ordersCount > 0 || offersCount > 0 || invoicesCount > 0) {
    throw new Error("لا يمكن حذف هذا العميل. له سجلات مرتبطة.")
  }

  await prisma.customer.delete({ where: { id: customerId } })

  await logActivity({
    userId: session.user.id,
    action: "DELETE",
    entityType: "Customer",
    entityId: customerId,
    entityName: customer?.name || "عميل",
    details: "تم حذف العميل",
  })

  revalidatePath("/customers")
}