"use server"

import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { logActivity } from "@/lib/activity-log"
import { getUsdToEgpRate } from "@/lib/usd-rate"

export async function createDeposit(prevState: any, formData: FormData) {
  try {
    const session = await auth()
    if (!session) return { error: "غير مصرح لك بالوصول." }
    await requirePermission("canManageDeposits")

    const depositName = formData.get("depositName") as string
    const productId = formData.get("productId") as string
    const quantity = parseInt(formData.get("quantity") as string)
    const notes = (formData.get("notes") as string) || undefined

    if (!quantity || quantity <= 0) {
      return { error: "يجب أن تكون الكمية أكبر من 0" }
    }

    // ✅ Check stock BEFORE creating deposit
    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) {
      return { error: "المنتج غير موجود" }
    }

    if (product.currentStock < quantity) {
      return { 
        error: `المخزون غير كافٍ للمنتج "${product.name}". المتاح: ${product.currentStock}، المطلوب: ${quantity}` 
      }
    }

    // Check if deposit exists, create if not
    let deposit = await prisma.deposit.findFirst({ where: { name: depositName } })
    
    if (!deposit) {
      deposit = await prisma.deposit.create({
        data: { name: depositName }
      })
    }

    await prisma.$transaction(async (tx) => {
      // Create or update deposit item
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

      // Deduct from main warehouse
      await tx.product.update({
        where: { id: productId },
        data: { currentStock: { decrement: quantity } }
      })

      // Create stock movement
      await tx.stockMovement.create({
        data: {
          productId,
          type: "STOCK_OUT",
          quantity,
          reason: `تحويل إلى وديعة ${depositName}`,
          userId: session.user.id
        }
      })
    })

    await logActivity({
      userId: session.user.id,
      action: "CREATE",
      entityType: "Deposit",
      entityId: deposit.id,
      entityName: `وديعة ${depositName}`,
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
  const session = await requirePermission("canManageDeposits")
  const itemId = formData.get("itemId") as string

  const [item, usdRate] = await Promise.all([
    prisma.depositItem.findUnique({ 
      where: { id: itemId }, 
      include: { product: true, deposit: true } 
    }),
    getUsdToEgpRate()
  ])

  if (!item || item.status !== "BORROWED") throw new Error("عنصر غير صالح للبيع")

  // ✅ استخدم سعر البيع USD × سعر الصرف
  const currentSellPriceUSD = item.product.sellPriceUSD.toNumber()
  const totalValueEGP = currentSellPriceUSD * usdRate * item.quantity

  await prisma.$transaction(async (tx) => {
    await tx.depositItem.update({
      where: { id: itemId },
      data: { 
        status: "SOLD", 
        soldDate: new Date(), 
        soldCostPrice: currentSellPriceUSD  // ✅ مخزن بـ USD
      }
    })
  })

  await logActivity({
    userId: session.user.id,
    action: "SELL",
    entityType: "Deposit",
    entityName: item.deposit.recipientName,
    details: `بيع ${item.quantity} ${item.product.unit} من ${item.product.name}. القيمة المحتسبة: ${totalValueEGP.toFixed(2)} EGP`,
  })

  revalidatePath("/deposits")
}

export async function returnDepositItem(formData: FormData) {
  const session = await requirePermission("canManageDeposits")
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
        reason: `مردود من أمانة: ${item.deposit.recipientName}`
      }
    })
  })

  await logActivity({
    userId: session.user.id,
    action: "RETURN",
    entityType: "Deposit",
    entityName: item.deposit.recipientName,
    details: `إرجاع ${item.quantity} ${item.product.unit} من منتج: ${item.product.name} إلى المخزن`,
  })

  revalidatePath("/deposits")
}