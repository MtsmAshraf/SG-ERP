"use server"

import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { logActivity } from "@/lib/activity-log"
import { getUsdToEgpRate } from "@/lib/usd-rate"
import { auth } from "@/auth"
import { notifyUsersWithPermission } from "@/lib/notifications"

export async function createCustody(prevState: any, formData: FormData) {
  try {
    const session = await auth()
    if (!session) return { error: "غير مصرح لك بالوصول." }
    await requirePermission("canManageCustodies")

    const employeeId = formData.get("employeeId") as string
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

    // ✅ Fetch employee details BEFORE creating custody
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      select: { firstName: true, lastName: true }
    })

    if (!employee) {
      return { error: "الموظف غير موجود" }
    }

    const employeeName = `${employee.firstName} ${employee.lastName}`

    const custody = await prisma.$transaction(async (tx) => {
      const newCustody = await tx.custody.create({
        data: {
          employeeId,
          notes,
          status: "ACTIVE",
          items: {
            create: {
              productId,
              quantity,
              status: "BORROWED"
            }
          }
        },
        include: {
          items: true
        }
      })

      await tx.product.update({
        where: { id: productId },
        data: { currentStock: { decrement: quantity } }
      })

      await tx.stockMovement.create({
        data: {
          productId,
          type: "STOCK_OUT",
          quantity,
          // ✅ FIXED: Use employee name instead of custody ID
          reason: `عهدة للموظف ${employeeName}`,
          userId: session.user.id
        }
      })

      return newCustody
    })

    await notifyUsersWithPermission("canViewCustodies", {
      type: "CUSTODY_OUT",
      title: "عهدة جديدة",
      message: `تم تسليم ${quantity} من ${product.name} كعهدة للموظف ${employeeName}`,
      link: "/custodies",
      entityType: "Custody",
      entityId: custody.id,
      actorId: session.user.id,
    })

    await logActivity({
      userId: session.user.id,
      action: "CREATE",
      entityType: "Custody",
      entityId: custody.id,
      entityName: `عهدة ${product.name}`,
      details: `تم إنشاء عهدة بمقدار ${quantity} للموظف ${employeeName}`,
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
  const authSession = await auth()
  if (!authSession) throw new Error("غير مصرح")
  await requirePermission("canManageCustodies")
  
  const itemId = formData.get("itemId") as string

  const item = await prisma.custodyItem.findUnique({ 
    where: { id: itemId }, 
    include: { 
      product: true, 
      custody: { include: { employee: true } } 
    } 
  })

  if (!item || item.status !== "BORROWED") throw new Error("عنصر غير صالح للبيع")

  const usdRate = await getUsdToEgpRate()
  const currentSellPriceUSD = item.product.sellPriceUSD.toNumber()
  const totalValueEGP = currentSellPriceUSD * usdRate * item.quantity

  await prisma.$transaction(async (tx) => {
    await tx.custodyItem.update({
      where: { id: itemId },
      data: { 
        status: "SOLD", 
        soldDate: new Date(), 
        soldCostPrice: currentSellPriceUSD
      }
    })
  })

  const employeeName = `${item.custody.employee.firstName} ${item.custody.employee.lastName}`

  // ✅ FIXED: Used correct variable names (item instead of custodyItem)
  await notifyUsersWithPermission("canViewCustodies", {
    type: "CUSTODY_SOLD",
    title: "تم بيع بند من العهدة",
    message: `تم بيع ${item.quantity} ${item.product.unit} من ${item.product.name} من عهدة ${employeeName}`,
    link: "/custodies",
    entityType: "Custody",
    entityId: item.id,
    actorId: authSession.user.id,
  })

  await logActivity({
    userId: authSession.user.id,
    action: "SELL",
    entityType: "Custody",
    entityId: item.id,
    entityName: employeeName,
    details: `بيع ${item.quantity} ${item.product.unit} من ${item.product.name}. القيمة المحتسبة: ${totalValueEGP.toFixed(2)} EGP`,
  })

  revalidatePath("/custodies")
}

export async function returnCustodyItem(formData: FormData) {
  const authSession = await auth()
  if (!authSession) throw new Error("غير مصرح")
  await requirePermission("canManageCustodies")
  
  const itemId = formData.get("itemId") as string

  const item = await prisma.custodyItem.findUnique({ 
    where: { id: itemId }, 
    include: { 
      product: true, 
      custody: { include: { employee: true } } 
    } 
  })
  if (!item || item.status !== "BORROWED") throw new Error("عنصر غير صالح للإرجاع")

  const employeeName = `${item.custody.employee.firstName} ${item.custody.employee.lastName}`

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
        reason: `مردود من عهدة: ${employeeName}`,
        userId: authSession.user.id
      }
    })
  })

  // ✅ FIXED: Used correct variable names (item instead of custodyItem)
  await notifyUsersWithPermission("canViewCustodies", {
    type: "CUSTODY_RETURNED",
    title: "تم إرجاع عهدة",
    message: `تم إرجاع ${item.quantity} ${item.product.unit} من ${item.product.name} من عهدة ${employeeName} إلى المخزن الرئيسي`,
    link: "/warehouse?view=custodies",
    entityType: "Custody",
    entityId: item.id,
    actorId: authSession.user.id,
  })

  await logActivity({
    userId: authSession.user.id,
    action: "RETURN",
    entityType: "Custody",
    entityId: item.id,
    entityName: employeeName,
    details: `إرجاع ${item.quantity} ${item.product.unit} من منتج: ${item.product.name} إلى المخزن`,
  })

  revalidatePath("/custodies")
}