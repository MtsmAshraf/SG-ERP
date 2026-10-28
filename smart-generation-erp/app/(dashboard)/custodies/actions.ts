"use server"

import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { logActivity } from "@/lib/activity-log"
import { getUsdToEgpRate } from "@/lib/usd-rate"
import { auth } from "@/auth"

export async function createCustody(prevState: any, formData: FormData) {
  try {
    const session = await auth()
    if (!session) return { error: "غير مصرح لك بالوصول." }
    await requirePermission("canManageCustodies")

    const employeeId = formData.get("employeeId") as string
    const productId = formData.get("productId") as string
    const quantity = parseInt(formData.get("quantity") as string)
    const notes = (formData.get("notes") as string) || undefined
    const expectedReturnDate = formData.get("expectedReturnDate") as string

    if (!quantity || quantity <= 0) {
      return { error: "يجب أن تكون الكمية أكبر من 0" }
    }

    // ✅ Check stock BEFORE creating custody
    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) {
      return { error: "المنتج غير موجود" }
    }

    if (product.currentStock < quantity) {
      return { 
        error: `المخزون غير كافٍ للمنتج "${product.name}". المتاح: ${product.currentStock}، المطلوب: ${quantity}` 
      }
    }

    const custody = await prisma.$transaction(async (tx) => {
      // Create custody record
      const newCustody = await tx.custody.create({
        data: {
          employeeId,
          productId,
          quantity,
          notes,
          expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
          status: "ACTIVE"
        }
      })

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
          reason: `عهدة للموظف - ${newCustody.id}`,
          userId: session.user.id
        }
      })

      return newCustody
    })

    await logActivity({
      userId: session.user.id,
      action: "CREATE",
      entityType: "Custody",
      entityId: custody.id,
      entityName: `عهدة ${product.name}`,
      details: `تم إنشاء عهدة بمقدار ${quantity} للموظف`,
    })

  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") throw error
    console.error("Create custody error:", error)
    return { error: error.message || "فشل إنشاء العهدة" }
  }
  
  revalidatePath("/custodies")
  redirect("/custodies")
}

export async function sellCustodyItem(formData: FormData) {
  const session = await requirePermission("canManageCustodies")
  const itemId = formData.get("itemId") as string

  const [item, usdRate] = await Promise.all([
    prisma.custodyItem.findUnique({ 
      where: { id: itemId }, 
      include: { 
        product: true, 
        custody: { include: { employee: true } } 
      } 
    }),
    getUsdToEgpRate()
  ])

  if (!item || item.status !== "BORROWED") throw new Error("عنصر غير صالح للبيع")

  // ✅ استخدم سعر البيع USD × سعر الصرف
  const currentSellPriceUSD = item.product.sellPriceUSD.toNumber()
  const totalValueEGP = currentSellPriceUSD * usdRate * item.quantity

  await prisma.$transaction(async (tx) => {
    await tx.custodyItem.update({
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
    entityType: "Custody",
    entityName: `${item.custody.employee.firstName} ${item.custody.employee.lastName}`,
    details: `بيع ${item.quantity} ${item.product.unit} من ${item.product.name}. القيمة المحتسبة: ${totalValueEGP.toFixed(2)} EGP`,
  })

  revalidatePath("/custodies")
}

export async function returnCustodyItem(formData: FormData) {
  const session = await requirePermission("canManageCustodies")
  const itemId = formData.get("itemId") as string

  const item = await prisma.custodyItem.findUnique({ 
    where: { id: itemId }, 
    include: { 
      product: true, 
      custody: { include: { employee: true } } 
    } 
  })
  if (!item || item.status !== "BORROWED") throw new Error("عنصر غير صالح للإرجاع")

  await prisma.$transaction(async (tx) => {
    await tx.custodyItem.update({
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
        reason: `مردود من عهدة: ${item.custody.employee.firstName} ${item.custody.employee.lastName}`
      }
    })
  })

  await logActivity({
    userId: session.user.id,
    action: "RETURN",
    entityType: "Custody",
    entityName: `${item.custody.employee.firstName} ${item.custody.employee.lastName}`,
    details: `إرجاع ${item.quantity} ${item.product.unit} من منتج: ${item.product.name} إلى المخزن`,
  })

  revalidatePath("/custodies")
}