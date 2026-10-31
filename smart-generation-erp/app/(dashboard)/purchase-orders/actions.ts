"use server"

import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { logActivity } from "@/lib/activity-log"
import { getUsdToEgpRate } from "@/lib/usd-rate"
import { notifyUser, notifyUsersWithPermission } from "@/lib/notifications"

export async function createPurchaseOrder(formData: FormData) {
  await requirePermission("canCreatePurchaseOrders")
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const supplierId = formData.get("supplierId") as string
  const notes = formData.get("notes") as string

  const count = await prisma.purchaseOrder.count()
  const poNumber = `PO-${String(count + 1).padStart(4, '0')}`

  const po = await prisma.purchaseOrder.create({
    data: { poNumber, supplierId, createdById: session.user.id, notes, status: "DRAFT", total: 0 }
  })

  await logActivity({
    userId: session.user.id,
    action: "CREATE",
    entityType: "PurchaseOrder",
    entityId: po.id,
    entityName: poNumber,
    details: "تم إنشاء أمر شراء جديد",
  })

  redirect(`/purchase-orders/${po.id}`)
}

export async function addPOItem(prevState: { error: string | null } | null, formData: FormData) {
  await requirePermission("canCreatePurchaseOrders")
  const session = await auth()
  if (!session) return { error: "غير مصرح" }

  const purchaseOrderId = formData.get("purchaseOrderId") as string
  const itemName = formData.get("itemName") as string
  const quantity = parseInt(formData.get("quantity") as string)
  const unit = formData.get("unit") as string
  const unitCostEGP = parseFloat(formData.get("unitCostEGP") as string)

  if (!itemName || itemName.trim() === "") return { error: "يجب إدخال اسم البند" }
  if (!unitCostEGP || unitCostEGP <= 0) return { error: "يجب أن يكون سعر الوحدة أكبر من 0" }
  if (!quantity || quantity <= 0) return { error: "يجب أن تكون الكمية أكبر من 0" }

  const po = await prisma.purchaseOrder.findUnique({ where: { id: purchaseOrderId } })
  if (!po) return { error: "أمر الشراء غير موجود" }

  const lineTotal = unitCostEGP * quantity

  await prisma.$transaction(async (tx) => {
    await tx.purchaseOrderItem.create({ 
      data: { 
        purchaseOrderId, 
        productId: null,      
        productName: itemName,
        unit: unit,           
        quantity, 
        unitCost: unitCostEGP, 
        lineTotal 
      } 
    })
    
    await tx.purchaseOrder.update({ 
      where: { id: purchaseOrderId }, 
      data: { total: { increment: lineTotal } } 
    })
  })

  await logActivity({
    userId: session.user.id,
    action: "ADD_ITEM",
    entityType: "PurchaseOrder",
    entityId: purchaseOrderId,
    entityName: po.poNumber,
    details: `تم إضافة بند مخصص: ${itemName} (الكمية: ${quantity})`,
  })

  revalidatePath(`/purchase-orders/${purchaseOrderId}`)
  return { error: null }
}

export async function removePOItem(formData: FormData) {
  await requirePermission("canCreatePurchaseOrders")
  const session = await auth()
  if (!session) return

  const itemId = formData.get("itemId") as string
  const purchaseOrderId = formData.get("purchaseOrderId") as string

  const item = await prisma.purchaseOrderItem.findUnique({ where: { id: itemId }, include: { product: true } })
  if (!item) return

  const po = await prisma.purchaseOrder.findUnique({ where: { id: purchaseOrderId } })

  // ✅ FIX: Safely get the item name (custom name OR product name OR fallback)
  const itemName = item.productName || item.product?.name || "بند"

  await prisma.$transaction(async (tx) => {
    await tx.purchaseOrderItem.delete({ where: { id: itemId } })
    await tx.purchaseOrder.update({ where: { id: purchaseOrderId }, data: { total: { decrement: item.lineTotal.toNumber() } } })
  })

  await logActivity({
    userId: session.user.id,
    action: "REMOVE_ITEM",
    entityType: "PurchaseOrder",
    entityId: purchaseOrderId,
    entityName: po?.poNumber || "أمر شراء",
    details: `تم حذف عنصر ${itemName}`, // ✅ Use the safe variable
  })

  revalidatePath(`/purchase-orders/${purchaseOrderId}`)
}

export async function submitPOForApproval(formData: FormData) {
  await requirePermission("canCreatePurchaseOrders")
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const purchaseOrderId = formData.get("purchaseOrderId") as string
  const po = await prisma.purchaseOrder.findUnique({ where: { id: purchaseOrderId } })
  
  if (!po || po.status !== "DRAFT") throw new Error("أمر شراء غير صالح")
  if (po.total.toNumber() <= 0) throw new Error("لا يمكن إرسال أمر شراء فارغ")

  await prisma.purchaseOrder.update({ where: { id: purchaseOrderId }, data: { status: "PENDING_APPROVAL" } })

    // ✅ Notify all users who can approve purchase orders
  await notifyUsersWithPermission("canApprovePurchaseOrders", {
    type: "PURCHASE_ORDER_SUBMITTED",
    title: "أمر شراء جديد بانتظار الاعتماد",
    message: `تم إرسال أمر الشراء ${po.poNumber} بواسطة ${session.user.name} للاعتماد`,
    link: `/purchase-orders/${purchaseOrderId}`,
    entityType: "PurchaseOrder",
    entityId: purchaseOrderId,
    actorId: session.user.id,
  })

  await logActivity({
    userId: session.user.id,
    action: "SUBMIT",
    entityType: "PurchaseOrder",
    entityId: purchaseOrderId,
    entityName: po.poNumber,
    details: "تم إرسال أمر الشراء للاعتماد",
  })

  revalidatePath(`/purchase-orders/${purchaseOrderId}`)
  revalidatePath("/purchase-orders")
}

export async function approvePO(formData: FormData) {
  await requirePermission("canApprovePurchaseOrders")
  const session = await auth()
  if (!session) throw new Error("Unauthorized")
  
  const purchaseOrderId = formData.get("purchaseOrderId") as string
  const po = await prisma.purchaseOrder.findUnique({ where: { id: purchaseOrderId } })
  if (!po || po.status !== "PENDING_APPROVAL") throw new Error("أمر شراء غير صالح")

  await prisma.purchaseOrder.update({ where: { id: purchaseOrderId }, data: { status: "APPROVED", approvedById: session.user.id } })
  
  await notifyUser(po.createdById, {
    type: "PURCHASE_ORDER_APPROVED",
    title: "تم اعتماد أمر الشراء",
    message: `تم اعتماد أمر الشراء ${po.poNumber} بواسطة ${session.user.name}`,
    link: `/purchase-orders/${purchaseOrderId}`,
    entityType: "PurchaseOrder",
    entityId: purchaseOrderId,
    actorId: session.user.id,
  })

  await logActivity({
    userId: session.user.id,
    action: "APPROVE",
    entityType: "PurchaseOrder",
    entityId: purchaseOrderId,
    entityName: po.poNumber,
    details: "تم اعتماد أمر الشراء",
  })

  revalidatePath(`/purchase-orders/${purchaseOrderId}`)
  revalidatePath("/purchase-orders")
}

export async function rejectPO(formData: FormData) {
  await requirePermission("canApprovePurchaseOrders")
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const purchaseOrderId = formData.get("purchaseOrderId") as string
  const po = await prisma.purchaseOrder.findUnique({ where: { id: purchaseOrderId } })
  if (!po || po.status !== "PENDING_APPROVAL") throw new Error("أمر شراء غير صالح")

  await prisma.purchaseOrder.update({ where: { id: purchaseOrderId }, data: { status: "REJECTED", approvedById: session.user.id } })

    // ✅ Notify the creator that their PO was rejected
  await notifyUser(po.createdById, {
    type: "PURCHASE_ORDER_REJECTED",
    title: "تم رفض أمر الشراء",
    message: `تم رفض أمر الشراء ${po.poNumber} بواسطة ${session.user.name}`,
    link: `/purchase-orders/${purchaseOrderId}`,
    entityType: "PurchaseOrder",
    entityId: purchaseOrderId,
    actorId: session.user.id,
  })

  await logActivity({
    userId: session.user.id,
    action: "REJECT",
    entityType: "PurchaseOrder",
    entityId: purchaseOrderId,
    entityName: po.poNumber,
    details: "تم رفض أمر الشراء",
  })

  revalidatePath(`/purchase-orders/${purchaseOrderId}`)
  revalidatePath("/purchase-orders")
}

export async function confirmPurchaseOrder(formData: FormData) {
  await requirePermission("canConfirmPurchaseOrders")
  const session = await auth()
  if (!session) throw new Error("Unauthorized")

  const purchaseOrderId = formData.get("purchaseOrderId") as string

  const po = await prisma.purchaseOrder.findUnique({
    where: { id: purchaseOrderId },
    include: { items: { include: { product: true } } }
  })

  if (!po || po.status !== "APPROVED") throw new Error("يجب اعتماد أمر الشراء قبل التأكيد")
  if (po.items.length === 0) throw new Error("لا يمكن تأكيد أمر شراء فارغ")

  await prisma.$transaction(async (tx) => {
    await tx.purchaseOrder.update({ 
      where: { id: purchaseOrderId }, 
      data: { status: "CONFIRMED" } 
    })

    for (const item of po.items) {
      if (item.productId) {
        // Catalog product → update main stock
        await tx.stockMovement.create({
          data: {
            productId: item.productId, 
            type: "STOCK_IN",
            quantity: item.quantity,
            reason: `استلام عبر ${po.poNumber}`,
            relatedPurchaseOrderId: purchaseOrderId
          }
        })
        
        await tx.product.update({
          where: { id: item.productId }, 
          data: { currentStock: { increment: item.quantity } }
        })
      } else {
        // ✅ Custom item → add to warehouse
        const existingItem = await tx.warehouseCustomItem.findFirst({
          where: { name: item.productName || "", unit: item.unit || "" }
        })
        
        if (existingItem) {
          await tx.warehouseCustomItem.update({
            where: { id: existingItem.id },
            data: { quantity: { increment: item.quantity } }
          })
          await tx.warehouseCustomItemMovement.create({
            data: {
              warehouseCustomItemId: existingItem.id,
              type: "IN",
              quantity: item.quantity,
              reason: `استلام عبر أمر الشراء ${po.poNumber}`,
              userId: session.user.id
            }
          })
        } else {
          const newItem = await tx.warehouseCustomItem.create({
            data: {
              name: item.productName || "بند مخصص",
              unit: item.unit || "pcs",
              quantity: item.quantity,
              notes: `مستلم من أمر الشراء ${po.poNumber}`
            }
          })
          await tx.warehouseCustomItemMovement.create({
            data: {
              warehouseCustomItemId: newItem.id,
              type: "IN",
              quantity: item.quantity,
              reason: `استلام أولي عبر أمر الشراء ${po.poNumber}`,
              userId: session.user.id
            }
          })
        }
      }
    }
  })

  await logActivity({
    userId: session.user.id,
    action: "CONFIRM",
    entityType: "PurchaseOrder",
    entityId: purchaseOrderId,
    entityName: po.poNumber,
    details: "تم تأكيد أمر الشراء واستلام المخزون",
  })

  revalidatePath(`/purchase-orders/${purchaseOrderId}`)
  revalidatePath("/purchase-orders")
  revalidatePath("/products")
  revalidatePath("/warehouse")
  redirect(`/purchase-orders/${purchaseOrderId}`)
}