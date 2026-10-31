"use server"

import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { logActivity } from "@/lib/activity-log"
import { getUsdToEgpRate } from "@/lib/usd-rate"
import { auth } from "@/auth"
import { notifyUsersWithPermission } from "@/lib/notifications"

export async function createDeposit(prevState: any, formData: FormData) {
  try {
    const session = await auth()
    if (!session) return { error: "غير مصرح لك بالوصول." }
    await requirePermission("canManageDeposits")

    const recipientName = ((formData.get("recipientName") as string) || "").trim()
    
    if (!recipientName) {
      return { error: "يجب إدخال اسم المستلم" }
    }

    const recipientType = formData.get("recipientType") as string
    const productId = formData.get("productId") as string
    const quantity = parseInt(formData.get("quantity") as string)
    const notes = (formData.get("notes") as string) || undefined

    if (!quantity || quantity <= 0) {
      return { error: "يجب أن تكون الكمية أكبر من 0" }
    }

    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) {
      return { error: "المنتج غير موجود" }
    }

    if (product.currentStock < quantity) {
      return { 
        error: `المخزون غير كافٍ للمنتج "${product.name}". المتاح: ${product.currentStock}، المطلوب: ${quantity}` 
      }
    }

    let deposit = await prisma.deposit.findFirst({ 
      where: { recipientName: recipientName } 
    })
    
    if (!deposit) {
      deposit = await prisma.deposit.create({
        data: { 
          recipientName: recipientName,
          recipientType: recipientType as any,
          status: "ACTIVE",
          notes: notes || `تم الإنشاء تلقائياً عند إضافة وديعة`
        }
      })
    }

    await prisma.$transaction(async (tx) => {
      const existingItem = await tx.depositItem.findFirst({
        where: { depositId: deposit.id, productId }
      })

      if (existingItem) {
        await tx.depositItem.update({
          where: { id: existingItem.id },
          data: { quantity: { increment: quantity } }
        })
      } else {
        await tx.depositItem.create({
          data: { depositId: deposit.id, productId, quantity }
        })
      }

      await tx.product.update({
        where: { id: productId },
        data: { currentStock: { decrement: quantity } }
      })

      await tx.stockMovement.create({
        data: {
          productId,
          type: "STOCK_OUT",
          quantity,
          reason: `تحويل إلى وديعة ${recipientName}`,
          userId: session.user.id
        }
      })
    })

    await notifyUsersWithPermission("canViewDeposits", {
      type: "DEPOSIT_OUT",
      title: "وديعة جديدة",
      message: `تم إضافة ${quantity} من ${product.name} إلى وديعة ${recipientName}`,
      link: "/deposits",
      entityType: "Deposit",
      entityId: deposit.id,
      actorId: session.user.id,
    })

    await logActivity({
      userId: session.user.id,
      action: "CREATE",
      entityType: "Deposit",
      entityId: deposit.id,
      entityName: `وديعة ${recipientName}`,
      details: `تم إضافة ${quantity} من ${product.name} إلى الوديعة`,
    })

  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") throw error
    console.error("Create deposit error:", error)
    return { error: error.message || "فشل إنشاء الوديعة" }
  }
  
  revalidatePath("/deposits")
  redirect("/deposits")
}

export async function sellDepositItem(formData: FormData) {
  const authSession = await auth()
  if (!authSession) throw new Error("غير مصرح")
  await requirePermission("canManageDeposits")
  
  const itemId = formData.get("itemId") as string

  const item = await prisma.depositItem.findUnique({ 
    where: { id: itemId }, 
    include: { product: true, deposit: true } 
  })

  if (!item || item.status !== "BORROWED") throw new Error("عنصر غير صالح للبيع")

  const usdRate = await getUsdToEgpRate()
  const currentSellPriceUSD = item.product.sellPriceUSD.toNumber()
  const totalValueEGP = currentSellPriceUSD * usdRate * item.quantity

  await prisma.$transaction(async (tx) => {
    await tx.depositItem.update({
      where: { id: itemId },
      data: { 
        status: "SOLD", 
        soldDate: new Date(), 
        soldCostPrice: currentSellPriceUSD
      }
    })
  })

  // ✅ FIXED: Used correct variable names (item instead of depositItem)
  await notifyUsersWithPermission("canViewDeposits", {
    type: "DEPOSIT_SOLD",
    title: "تم بيع بند من الوديعة",
    message: `تم بيع ${item.quantity} ${item.product.unit} من ${item.product.name} من وديعة ${item.deposit.recipientName}`,
    link: "/deposits",
    entityType: "Deposit",
    entityId: item.id,
    actorId: authSession.user.id,
  })

  await logActivity({
    userId: authSession.user.id,
    action: "SELL",
    entityType: "Deposit",
    entityId: item.id,
    entityName: item.deposit.recipientName,
    details: `بيع ${item.quantity} ${item.product.unit} من ${item.product.name}. القيمة المحتسبة: ${totalValueEGP.toFixed(2)} EGP`,
  })

  revalidatePath("/deposits")
}

export async function returnDepositItem(formData: FormData) {
  const authSession = await auth()
  if (!authSession) throw new Error("غير مصرح")
  await requirePermission("canManageDeposits")
  
  const itemId = formData.get("itemId") as string

  const item = await prisma.depositItem.findUnique({ 
    where: { id: itemId }, 
    include: { product: true, deposit: true } 
  })
  if (!item || item.status !== "BORROWED") throw new Error("عنصر غير صالح للإرجاع")

  await prisma.$transaction(async (tx) => {
    await tx.depositItem.update({
      where: { id: itemId },
      data: { status: "RETURNED", returnedDate: new Date() }
    })

    await tx.product.update({
      where: { id: item.productId },
      data: { currentStock: { increment: item.quantity } }
    })

    await tx.stockMovement.create({
      data: {
        productId: item.productId,
        type: "STOCK_IN",
        quantity: item.quantity,
        reason: `مردود من أمانة: ${item.deposit.recipientName}`,
        userId: authSession.user.id
      }
    })
  })

  // ✅ FIXED: Used correct variable names (item instead of depositItem)
  await notifyUsersWithPermission("canViewDeposits", {
    type: "DEPOSIT_RETURNED",
    title: "تم إرجاع وديعة",
    message: `تم إرجاع ${item.quantity} ${item.product.unit} من ${item.product.name} من وديعة ${item.deposit.recipientName} إلى المخزن الرئيسي`,
    link: "/warehouse?view=deposits",
    entityType: "Deposit",
    entityId: item.id,
    actorId: authSession.user.id,
  })

  await logActivity({
    userId: authSession.user.id,
    action: "RETURN",
    entityType: "Deposit",
    entityId: item.id,
    entityName: item.deposit.recipientName,
    details: `إرجاع ${item.quantity} ${item.product.unit} من منتج: ${item.product.name} إلى المخزن`,
  })

  revalidatePath("/deposits")
}