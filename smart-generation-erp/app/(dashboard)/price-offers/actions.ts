"use server"

import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { logActivity } from "@/lib/activity-log"
import { getUsdToEgpRate } from "@/lib/usd-rate"
import { notifyUser, notifyUsersWithPermission } from "@/lib/notifications"

export async function createPriceOffer(formData: FormData) {
  try {
    await requirePermission("canCreatePriceOffers")
    const session = await auth()
    if (!session) return { error: "غير مصرح لك بالوصول." }

    const customerId = formData.get("customerId") as string
    const defaultPercentage = parseFloat(formData.get("defaultPercentage") as string) || 0
    const notes = formData.get("notes") as string

    const count = await prisma.priceOffer.count()
    const offerNumber = `PO-${String(count + 1).padStart(4, '0')}`

    const offer = await prisma.priceOffer.create({
      data: {
        offerNumber,
        customerId,
        createdById: session.user.id,
        notes,
        defaultPercentage,
        status: "DRAFT",
        total: 0
      }
    })

    await logActivity({
      userId: session.user.id,
      action: "CREATE",
      entityType: "PriceOffer",
      entityId: offer.id,
      entityName: offerNumber,
    })

    redirect(`/price-offers/${offer.id}`)
  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") throw error
    console.error("Create price offer error:", error)
    return { error: error.message || "فشل إنشاء عرض السعر" }
  }
}

export async function addOfferItem(prevState: { error: string | null }, formData: FormData) {
  await requirePermission("canCreatePriceOffers")
  const offerId = formData.get("offerId") as string
  const productId = formData.get("productId") as string
  const quantity = parseInt(formData.get("quantity") as string)
  const percentage = parseFloat(formData.get("percentage") as string)

  if (!quantity || quantity <= 0) {
    return { error: "يجب أن تكون الكمية أكبر من 0" }
  }

  const [product, offer] = await Promise.all([
    prisma.product.findUnique({ where: { id: productId } }),
    prisma.priceOffer.findUnique({ where: { id: offerId } })
  ])

  if (!product) return { error: "المنتج غير موجود" }
  if (!offer) return { error: "العرض غير موجود" }

  // ✅ Use the provided percentage, or fall back to the offer's default
  const finalPercentage = isNaN(percentage) ? offer.defaultPercentage.toNumber() : percentage
  const basePriceUSD = product.sellPriceUSD.toNumber()
  const finalPriceUSD = basePriceUSD * (1 + finalPercentage / 100)
  const lineTotalUSD = finalPriceUSD * quantity

  await prisma.$transaction(async (tx) => {
    await tx.priceOfferItem.create({
      data: { 
        priceOfferId: offerId, 
        productId, 
        quantity, 
        unitPrice: finalPriceUSD,
        lineTotal: lineTotalUSD
      }
    })
    await tx.priceOffer.update({
      where: { id: offerId },
      data: { total: { increment: lineTotalUSD } }
    })
  })

  revalidatePath(`/price-offers/${offerId}`)
  return { error: null }
}

export async function removeOfferItem(formData: FormData) {
  await requirePermission("canCreatePriceOffers")
  const itemId = formData.get("itemId") as string
  const priceOfferId = formData.get("priceOfferId") as string

  const item = await prisma.priceOfferItem.findUnique({ where: { id: itemId } })
  if (!item) return

  await prisma.$transaction(async (tx) => {
    await tx.priceOfferItem.delete({ where: { id: itemId } })
    await tx.priceOffer.update({
      where: { id: priceOfferId },
      data: { total: { decrement: item.lineTotal.toNumber() } }
    })
  })

  revalidatePath(`/price-offers/${priceOfferId}`)
}

export async function submitOfferForApproval(formData: FormData) {
  await requirePermission("canCreatePriceOffers")
  const priceOfferId = formData.get("priceOfferId") as string
  
  const session = await auth()
  if (!session) throw new Error("غير مصرح لك بالوصول")

  const offer = await prisma.priceOffer.findUnique({ where: { id: priceOfferId } })
  if (!offer || offer.status !== "DRAFT") throw new Error("عرض سعر غير صالح")
  if (offer.total.toNumber() <= 0) throw new Error("لا يمكن إرسال عرض سعر فارغ")

  await prisma.priceOffer.update({
    where: { id: priceOfferId },
    data: { status: "PENDING_APPROVAL" }
  })
  await notifyUsersWithPermission("canApprovePriceOffers", {
      type: "PRICE_OFFER_SUBMITTED",
      title: "عرض سعر جديد بانتظار الاعتماد",
      message: `تم إرسال عرض السعر ${offer.offerNumber} بواسطة ${session.user.name} للاعتماد`,
      link: `/price-offers/${offer.id}`, // ✅ FIXED: use offer.id
      entityType: "PriceOffer",
      entityId: offer.id,                 // ✅ FIXED: use offer.id
      actorId: session.user.id,
    })

  revalidatePath(`/price-offers/${priceOfferId}`)
  revalidatePath("/price-offers")
}

export async function approveOffer(formData: FormData) {
  await requirePermission("canApprovePriceOffers")
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  
  const priceOfferId = formData.get("priceOfferId") as string
  const offer = await prisma.priceOffer.findUnique({ 
    where: { id: priceOfferId },
    include: { items: { include: { product: true } } }
  })
  
  if (!offer || offer.status !== "PENDING_APPROVAL") throw new Error("عرض سعر غير صالح")

  // ✅ CHECK STOCK FOR ALL ITEMS BEFORE APPROVING
  const stockIssues: string[] = []
  
  for (const item of offer.items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } })
    if (!product) {
      stockIssues.push(`المنتج غير موجود: ${item.productId}`)
      continue
    }
    
    if (product.currentStock < item.quantity) {
      stockIssues.push(
        `${product.name}: المتاح ${product.currentStock}، المطلوب ${item.quantity}`
      )
    }
  }

  // If there are stock issues, throw error with details
  if (stockIssues.length > 0) {
    throw new Error(
      `لا يمكن اعتماد العرض بسبب نقص المخزون:\n${stockIssues.join('\n')}`
    )
  }

  await prisma.priceOffer.update({
    where: { id: priceOfferId },
    data: { status: "APPROVED", approvedById: session.user.id }
  })

  await notifyUser(offer.createdById, {
      type: "PRICE_OFFER_APPROVED",
      title: "تم اعتماد عرض السعر",
      message: `تم اعتماد عرض السعر ${offer.offerNumber} بواسطة ${session.user.name}`,
      link: `/price-offers/${offer.id}`,
      entityType: "PriceOffer",
      entityId: offer.id,
      actorId: session.user.id,
    })

  await logActivity({
    userId: session.user.id,
    action: "APPROVE",
    entityType: "PriceOffer",
    entityId: priceOfferId,
    entityName: offer.offerNumber,
    details: "تم اعتماد عرض السعر",
  })

  revalidatePath(`/price-offers/${priceOfferId}`)
  revalidatePath("/price-offers")
}

export async function rejectOffer(formData: FormData) {
  await requirePermission("canApprovePriceOffers")
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const priceOfferId = formData.get("priceOfferId") as string
  const offer = await prisma.priceOffer.findUnique({ where: { id: priceOfferId } })
  if (!offer || offer.status !== "PENDING_APPROVAL") throw new Error("عرض سعر غير صالح")

  await prisma.priceOffer.update({
    where: { id: priceOfferId },
    data: { status: "REJECTED", approvedById: session.user.id }
  })

    await notifyUser(offer.createdById, {
      type: "PRICE_OFFER_REJECTED",
      title: "تم رفض عرض السعر",
      message: `تم رفض عرض السعر ${offer.offerNumber} بواسطة ${session.user.name}`,
      link: `/price-offers/${offer.id}`,
      entityType: "PriceOffer",
      entityId: offer.id,
      actorId: session.user.id,
    })

  await logActivity({
    userId: session.user.id,
    action: "REJECT",
    entityType: "PriceOffer",
    entityId: priceOfferId,
    entityName: offer.offerNumber,
    details: "تم رفض عرض السعر",
  })

  revalidatePath(`/price-offers/${priceOfferId}`)
  revalidatePath("/price-offers")
}

export async function convertOfferToSalesOrder(formData: FormData) {
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  await requirePermission("canConvertPriceOffers")

  const offerId = formData.get("priceOfferId") as string
  
  const offer = await prisma.priceOffer.findUnique({
    where: { id: offerId },
    include: { items: true, customer: true }
  })

  if (!offer || offer.status !== "APPROVED") throw new Error("العرض غير معتمد أو غير موجود")

  const usdRate = await getUsdToEgpRate()

  await prisma.$transaction(async (tx) => {
    // 1. Count for Sales Order Number
    const soCount = await tx.salesOrder.count()
    const orderNumber = `SO-${String(soCount + 1).padStart(4, '0')}`

    // 2. Count for Invoice Number
    const invCount = await tx.invoice.count()
    const invoiceNumber = `INV-${String(invCount + 1).padStart(4, '0')}`

    // 3. Create the Sales Order
    const salesOrder = await tx.salesOrder.create({
      data: {
        orderNumber,
        customerId: offer.customerId,
        priceOfferId: offer.id,
        createdById: session.user.id,
        status: "CONFIRMED",
        total: offer.total.toNumber() * usdRate,
      }
    })

      // 4. Create the Invoice (Draft/Unpaid by default)
    await tx.invoice.create({
      data: {
        invoiceNumber,
        customerId: offer.customerId,
        salesOrderId: salesOrder.id,
        subtotal: offer.total.toNumber() * usdRate, // ✅ Match your schema
        taxRate: 0, // ✅ Match your schema
        taxAmount: 0, // ✅ Match your schema
        total: offer.total.toNumber() * usdRate,
        status: "DRAFT", 
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 
      }
    })
    // 5. Create Order Items & Deduct Stock
    for (const item of offer.items) {
      await tx.orderItem.create({
        data: {
          salesOrderId: salesOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice.toNumber() * usdRate,
          lineTotal: item.lineTotal.toNumber() * usdRate
        }
      })

      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: { decrement: item.quantity } }
      })
      
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: "STOCK_OUT",
          quantity: item.quantity,
          reason: `بيع عبر عرض سعر ${offer.offerNumber}`,
          relatedOrderId: salesOrder.id
        }
      })
    }

    // 6. Mark Offer as Converted
    await tx.priceOffer.update({
      where: { id: offerId },
      data: { status: "CONVERTED_TO_ORDER", convertedOrderNumber: orderNumber }
    })
  })

  await logActivity({
    userId: session.user.id,
    action: "CONVERT",
    entityType: "PriceOffer",
    entityId: offerId,
    entityName: offer.offerNumber,
    details: `تم التحويل إلى أمر بيع وإنشاء فاتورة`,
  })

  revalidatePath("/price-offers")
  revalidatePath("/sales-orders")
  revalidatePath("/invoices")
  revalidatePath("/customers")
  revalidatePath("/products")
  redirect(`/sales-orders`)
}

export async function deletePriceOffer(formData: FormData) {
  const session = await auth()
  if (!session) return
  await requirePermission("canDeletePriceOffers")

  const offerId = formData.get("offerId") as string
  const offer = await prisma.priceOffer.findUnique({ where: { id: offerId } })

  if (!offer) throw new Error("عرض السعر غير موجود")
  if (offer.status === "CONVERTED_TO_ORDER") {
    throw new Error("لا يمكن حذف عرض سعر تم تحويله بالفعل إلى أمر بيع.")
  }

  await prisma.$transaction(async (tx) => {
    await tx.priceOfferItem.deleteMany({ where: { priceOfferId: offerId } })
    await tx.priceOffer.delete({ where: { id: offerId } })
  })

  await logActivity({
    userId: session.user.id,
    action: "DELETE",
    entityType: "PriceOffer",
    entityId: offerId,
    entityName: offer.offerNumber,
  })

  revalidatePath("/price-offers")
}