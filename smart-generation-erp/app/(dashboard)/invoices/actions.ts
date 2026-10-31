"use server"

import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { logActivity } from "@/lib/activity-log"
import { notifyUsersWithPermission } from "@/lib/notifications"
import { auth } from "@/auth"

export async function generateInvoice(formData: FormData) {
  const session = await requirePermission("canCreateSalesOrders")
  const salesOrderId = formData.get("salesOrderId") as string

  try {
    const [salesOrder, settings] = await Promise.all([
      prisma.salesOrder.findUnique({ 
        where: { id: salesOrderId },
        include: { customer: true, items: { include: { product: true } } }
      }),
      prisma.companySettings.findUnique({ where: { id: "global_settings" } })
    ])

    if (!salesOrder) throw new Error("أمر البيع غير موجود.")
    if (salesOrder.status !== "CONFIRMED") throw new Error("يمكن إصدار فاتورة فقط لأوامر البيع المؤكدة.")

    const existing = await prisma.invoice.findUnique({ where: { salesOrderId } })
    if (existing) throw new Error("تم إصدار فاتورة لهذا الطلب مسبقاً.")

    const taxRate = settings?.taxRate.toNumber() || 0
    const subtotal = salesOrder.total.toNumber()
    const taxAmount = subtotal * (taxRate / 100)
    const total = subtotal + taxAmount

    const count = await prisma.invoice.count()
    const invoiceNumber = `INV-${String(count + 1).padStart(4, '0')}`

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        salesOrderId,
        customerId: salesOrder.customerId,
        subtotal,
        taxRate,
        taxAmount,
        total,
        status: "DRAFT",
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      }
    })

    await logActivity({
      userId: session.user.id,
      action: "CREATE",
      entityType: "Invoice",
      entityId: invoice.id,
      entityName: invoice.invoiceNumber,
      details: `فاتورة للعميل ${salesOrder.customer.name}`,
    })

  } catch (error: any) {
    throw new Error(error.message || "حدث خطأ أثناء إنشاء الفاتورة.")
  }

  revalidatePath("/invoices")
  redirect("/invoices")
}

export async function markInvoiceAsPaid(formData: FormData) {
  const session = await auth()
  if (!session) throw new Error("غير مصرح")
  await requirePermission("canManageInvoices")

  const invoiceId = formData.get("invoiceId") as string

  // 1. Fetch the invoice
  const invoice = await prisma.invoice.findUnique({ 
    where: { id: invoiceId } 
  })

  // ✅ FIXED: Add null check before using the invoice object
  if (!invoice) {
    throw new Error("الفاتورة غير موجودة")
  }

  // 2. Update the invoice
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { 
      status: "PAID", 
      paidAt: new Date() 
    }
  })

  // 3. Notify users (Now TypeScript knows 'invoice' is not null)
  await notifyUsersWithPermission("canManageInvoices", {
    type: "INVOICE_PAID",
    title: "تم دفع الفاتورة",
    message: `تم تسجيل دفع الفاتورة رقم ${invoice.invoiceNumber} بنجاح`,
    link: `/invoices/${invoice.id}/print`,
    entityType: "Invoice",
    entityId: invoice.id,
    actorId: session.user.id,
  })

  await logActivity({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "Invoice",
    entityId: invoice.id,
    entityName: invoice.invoiceNumber,
    details: "تم تسجيل دفع الفاتورة",
  })

  revalidatePath("/invoices")
  revalidatePath(`/invoices/${invoiceId}`)
}