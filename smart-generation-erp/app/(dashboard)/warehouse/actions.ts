"use server"

import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { logActivity } from "@/lib/activity-log"
import { notifyUsersWithPermission } from "@/lib/notifications"

// Adjust catalog product stock
export async function adjustProductStock(prevState: any, formData: FormData) {
  const session = await auth()
  if (!session) return { error: "غير مصرح" }
  await requirePermission("canManageWarehouse")

  const productId = formData.get("productId") as string
  const type = formData.get("type") as "IN" | "OUT"
  const quantity = parseInt(formData.get("quantity") as string)
  const reason = (formData.get("reason") as string) || "تعديل من المخزن"

  if (!quantity || quantity <= 0) return { error: "الكمية يجب أن تكون أكبر من 0" }

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) return { error: "المنتج غير موجود" }

  const stockChange = type === "IN" ? quantity : -quantity
  const newStock = product.currentStock + stockChange

  if (newStock < 0) {
    return { error: `لا يمكن الخصم. المخزون الحالي: ${product.currentStock}` }
  }

  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.create({
      data: {
        productId,
        type: type === "IN" ? "STOCK_IN" : "STOCK_OUT",
        quantity,
        reason,
      }
    })
    await tx.product.update({
      where: { id: productId },
      data: { currentStock: { increment: stockChange } }
    })
  })

  await logActivity({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "Product",
    entityId: productId,
    entityName: product.name,
    details: `${type === "IN" ? "إدخال" : "إخراج"} ${quantity} من ${product.name}. السبب: ${reason}`,
  })

  revalidatePath("/warehouse")
  revalidatePath("/products")
  return { error: null }
}

// Adjust custom warehouse item stock
export async function adjustCustomItemStock(prevState: any, formData: FormData) {
  const session = await auth()
  if (!session) return { error: "غير مصرح" }
  await requirePermission("canManageWarehouse")

  const itemId = formData.get("itemId") as string
  const type = formData.get("type") as "IN" | "OUT"
  const quantity = parseInt(formData.get("quantity") as string)
  const reason = (formData.get("reason") as string) || "تعديل من المخزن"

  if (!quantity || quantity <= 0) return { error: "الكمية يجب أن تكون أكبر من 0" }

  const item = await prisma.warehouseCustomItem.findUnique({ where: { id: itemId } })
  if (!item) return { error: "البند غير موجود" }

  const stockChange = type === "IN" ? quantity : -quantity
  const newStock = item.quantity + stockChange

  if (newStock < 0) {
    return { error: `لا يمكن الخصم. الكمية الحالية: ${item.quantity}` }
  }

  await prisma.$transaction(async (tx) => {
    await tx.warehouseCustomItemMovement.create({
      data: {
        warehouseCustomItemId: itemId,
        type: type === "IN" ? "IN" : "OUT",
        quantity,
        reason,
        userId: session.user.id
      }
    })
    await tx.warehouseCustomItem.update({
      where: { id: itemId },
      data: { quantity: { increment: stockChange } }
    })
  })

  await logActivity({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "WarehouseCustomItem",
    entityId: itemId,
    entityName: item.name,
    details: `${type === "IN" ? "إدخال" : "إخراج"} ${quantity} ${item.unit} من ${item.name}. السبب: ${reason}`,
  })

  revalidatePath("/warehouse")
  return { error: null }
}

// Create a new custom item manually
export async function createCustomWarehouseItem(prevState: any, formData: FormData) {
  const session = await auth()
  if (!session) return { error: "غير مصرح" }
  await requirePermission("canManageWarehouse")

  const name = formData.get("name") as string
  const unit = formData.get("unit") as string
  const initialQuantity = parseInt(formData.get("initialQuantity") as string) || 0
  const notes = (formData.get("notes") as string) || undefined

  if (!name || name.trim() === "") return { error: "يجب إدخال اسم البند" }

  try {
    const item = await prisma.warehouseCustomItem.create({
      data: { name, unit, quantity: initialQuantity, notes }
    })

    if (initialQuantity > 0) {
      await prisma.warehouseCustomItemMovement.create({
        data: {
          warehouseCustomItemId: item.id,
          type: "IN",
          quantity: initialQuantity,
          reason: "رصيد افتتاحي",
          userId: session.user.id
        }
      })
    }

    await logActivity({
      userId: session.user.id,
      action: "CREATE",
      entityType: "WarehouseCustomItem",
      entityId: item.id,
      entityName: name,
      details: `تم إنشاء بند مخصص جديد في المخزن: ${name}`,
    })
  } catch (error: any) {
    return { error: error.message || "فشل إنشاء البند" }
  }

  revalidatePath("/warehouse")
  return { error: null }
}


// ✅ Return items from deposit back to main warehouse
export async function returnFromDeposit(prevState: any, formData: FormData) {
  const session = await auth()
  if (!session) return { error: "غير مصرح" }
  await requirePermission("canManageWarehouse")

  const depositItemId = formData.get("depositItemId") as string
  const productId = formData.get("productId") as string
  const quantity = parseInt(formData.get("quantity") as string)
  const reason = (formData.get("reason") as string) || "إرجاع من وديعة"

  if (!quantity || quantity <= 0) return { error: "الكمية يجب أن تكون أكبر من 0" }

  try {
    const depositItem = await prisma.depositItem.findUnique({
      where: { id: depositItemId },
      include: { deposit: true, product: true }
    })

    if (!depositItem) return { error: "البند في الوديعة غير موجود" }
    if (depositItem.quantity < quantity) {
      return { error: `الكمية المتاحة في الوديعة: ${depositItem.quantity}` }
    }

    await prisma.$transaction(async (tx) => {
      // Decrement deposit item
      await tx.depositItem.update({
        where: { id: depositItemId },
        data: { quantity: { decrement: quantity } }
      })

      // Increment main warehouse stock
      await tx.product.update({
        where: { id: productId },
        data: { currentStock: { increment: quantity } }
      })

      // Create stock movement
      await tx.stockMovement.create({
        data: {
          productId,
          type: "STOCK_IN",
          quantity,
          reason: `${reason} - من وديعة ${depositItem.deposit.recipientName}`, // ✅ FIXED: recipientName
          userId: session.user.id
        }
      })
    })

        // ✅ Notify that a deposit was returned
    await notifyUsersWithPermission("canViewDeposits", {
      type: "DEPOSIT_RETURNED",
      title: "تم إرجاع وديعة",
      message: `تم إرجاع ${quantity} ${depositItem.product.unit} من ${depositItem.product.name} من وديعة ${depositItem.deposit.recipientName} إلى المخزن`,
      link: "/warehouse?view=deposits",
      entityType: "Deposit",
      entityId: depositItemId,
      actorId: session.user.id,
    })

    await logActivity({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "Deposit",
      entityId: depositItemId,
      entityName: depositItem.product.name,
      details: `إرجاع ${quantity} ${depositItem.product.unit} من وديعة ${depositItem.deposit.recipientName} إلى المخزن الرئيسي`,
    })
  } catch (error: any) {
    return { error: error.message || "فشل الإرجاع" }
  }

  revalidatePath("/warehouse")
  revalidatePath("/products")
  return { error: null }
}

// ✅ Return items from custody back to main warehouse
export async function returnFromCustody(prevState: any, formData: FormData) {
  const session = await auth()
  if (!session) return { error: "غير مصرح" }
  await requirePermission("canManageWarehouse")

  const custodyItemId = formData.get("custodyItemId") as string
  const productId = formData.get("productId") as string
  const quantity = parseInt(formData.get("quantity") as string)
  const reason = (formData.get("reason") as string) || "إرجاع من عهدة"

  if (!quantity || quantity <= 0) return { error: "الكمية يجب أن تكون أكبر من 0" }

  try {
    const custodyItem = await prisma.custodyItem.findUnique({
      where: { id: custodyItemId },
      include: { 
        custody: { include: { employee: true } }, 
        product: true // ✅ Explicitly included
      }
    })

    if (!custodyItem) return { error: "العهد غير موجود" }
    if (custodyItem.quantity < quantity) {
      return { error: `الكمية المتاحة في العهدة: ${custodyItem.quantity}` }
    }

    const employeeName = `${custodyItem.custody.employee.firstName} ${custodyItem.custody.employee.lastName}`

    await prisma.$transaction(async (tx) => {
      // Decrement custody item
      await tx.custodyItem.update({
        where: { id: custodyItemId },
        data: { quantity: { decrement: quantity } }
      })

      // Increment main warehouse stock
      await tx.product.update({
        where: { id: productId },
        data: { currentStock: { increment: quantity } }
      })

      // Create stock movement
      await tx.stockMovement.create({
        data: {
          productId,
          type: "STOCK_IN",
          quantity,
          reason: `${reason} - من عهدة ${employeeName}`,
          userId: session.user.id
        }
      })
    })

     // ✅ Notify that a custody was returned
    await notifyUsersWithPermission("canViewCustodies", {
      type: "CUSTODY_RETURNED",
      title: "تم إرجاع عهدة",
      message: `تم إرجاع ${quantity} ${custodyItem.product.unit} من ${custodyItem.product.name} من عهدة ${employeeName} إلى المخزن`,
      link: "/warehouse?view=custodies",
      entityType: "Custody",
      entityId: custodyItemId,
      actorId: session.user.id,
    })

    await logActivity({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "Custody",
      entityId: custodyItemId,
      entityName: custodyItem.product.name,
      details: `إرجاع ${quantity} ${custodyItem.product.unit} من عهدة ${employeeName} إلى المخزن الرئيسي`,
    })
  } catch (error: any) {
    return { error: error.message || "فشل الإرجاع" }
  }

  revalidatePath("/warehouse")
  revalidatePath("/products")
  return { error: null }
}