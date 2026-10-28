"use server"

import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { logActivity } from "@/lib/activity-log"
import { getUsdToEgpRate } from "@/lib/usd-rate"

export async function createSalesOrder(formData: FormData) {
  await requirePermission("canCreateSalesOrders")
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const customerId = formData.get("customerId") as string
  const priceOfferId = formData.get("priceOfferId") as string | null

  const count = await prisma.salesOrder.count()
  const orderNumber = `SO-${String(count + 1).padStart(4, '0')}`

  const order = await prisma.salesOrder.create({
    data: {
      orderNumber,
      customerId,
      priceOfferId: priceOfferId || undefined,
      createdById: session.user.id,
      status: "DRAFT",
      total: 0
    }
  })

  await logActivity({
    userId: session.user.id,
    action: "CREATE",
    entityType: "SalesOrder",
    entityId: order.id,
    entityName: orderNumber,
  })

  redirect(`/sales-orders/${order.id}`)
}

export async function addOrderItem(prevState: { error: string | null }, formData: FormData) {
  await requirePermission("canCreateSalesOrders")
  const salesOrderId = formData.get("salesOrderId") as string
  const productId = formData.get("productId") as string
  const quantity = parseInt(formData.get("quantity") as string)
  const percentage = parseFloat(formData.get("percentage") as string) || 0

  if (!quantity || quantity <= 0) {
    return { error: "يجب أن تكون الكمية أكبر من 0" }
  }

  const [product, usdRate] = await Promise.all([
    prisma.product.findUnique({ where: { id: productId } }),
    getUsdToEgpRate()
  ])

  if (!product) {
    return { error: "المنتج غير موجود" }
  }

  // ✅ احسب السعر بـ EGP: (سعر البيع USD × (1 + النسبة/100)) × سعر الصرف
  const basePriceUSD = product.sellPriceUSD.toNumber()
  const finalPriceUSD = basePriceUSD * (1 + percentage / 100)
  const unitPriceEGP = finalPriceUSD * usdRate
  const lineTotal = unitPriceEGP * quantity

  await prisma.$transaction(async (tx) => {
    await tx.orderItem.create({
      data: { 
        salesOrderId, 
        productId, 
        quantity, 
        unitPrice: unitPriceEGP,  // ✅ مخزن بـ EGP
        lineTotal                  // ✅ مخزن بـ EGP
      }
    })
    await tx.salesOrder.update({
      where: { id: salesOrderId },
      data: { total: { increment: lineTotal } }
    })
  })

  revalidatePath(`/sales-orders/${salesOrderId}`)
  return { error: null }
}

export async function removeOrderItem(formData: FormData) {
  await requirePermission("canCreateSalesOrders")
  const itemId = formData.get("itemId") as string
  const salesOrderId = formData.get("salesOrderId") as string

  const item = await prisma.orderItem.findUnique({ where: { id: itemId } })
  if (!item) return

  await prisma.$transaction(async (tx) => {
    await tx.orderItem.delete({ where: { id: itemId } })
    await tx.salesOrder.update({
      where: { id: salesOrderId },
      data: { total: { decrement: item.lineTotal.toNumber() } }
    })
  })

  revalidatePath(`/sales-orders/${salesOrderId}`)
}

export async function confirmSalesOrder(formData: FormData) {
  await requirePermission("canConfirmSalesOrders")
  const session = await auth()
  if (!session) throw new Error("غير مصرح لك بالوصول.")

  const salesOrderId = formData.get("salesOrderId") as string

  const salesOrder = await prisma.salesOrder.findUnique({
    where: { id: salesOrderId },
    include: { items: { include: { product: true } } }
  })

  if (!salesOrder) throw new Error("أمر البيع غير موجود")
  
  // ✅ FIX: Check that status is DRAFT (the only valid state before CONFIRMED)
  if (salesOrder.status !== "DRAFT") {
    throw new Error("يمكن تأكيد أمر البيع فقط إذا كان في حالة المسودة")
  }
  
  if (salesOrder.items.length === 0) throw new Error("لا يمكن تأكيد أمر بيع فارغ")

  await prisma.$transaction(async (tx) => {
    // ✅ Check stock for each item BEFORE deducting
    for (const item of salesOrder.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } })
      if (!product) throw new Error(`المنتج غير موجود: ${item.productId}`)
      
      if (product.currentStock < item.quantity) {
        throw new Error(
          `المخزون غير كافٍ للمنتج "${product.name}". المتاح: ${product.currentStock}، المطلوب: ${item.quantity}`
        )
      }
    }

    // ✅ All stock checks passed, now deduct and create movements
    await tx.salesOrder.update({
      where: { id: salesOrderId },
      data: { status: "CONFIRMED" }
    })

    for (const item of salesOrder.items) {
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: "STOCK_OUT",
          quantity: item.quantity,
          reason: `بيع عبر أمر بيع ${salesOrder.orderNumber}`,
          relatedOrderId: salesOrderId
        }
      })

      await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: { decrement: item.quantity } }
      })
    }
  })

  await logActivity({
    userId: session.user.id,
    action: "CONFIRM",
    entityType: "SalesOrder",
    entityId: salesOrderId,
    entityName: salesOrder.orderNumber,
    details: "تم تأكيد أمر البيع وخصم المخزون",
  })

  revalidatePath(`/sales-orders/${salesOrderId}`)
  revalidatePath("/sales-orders")
  revalidatePath("/products")
  redirect(`/sales-orders/${salesOrderId}`)
}