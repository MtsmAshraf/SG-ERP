"use server"

import { prisma } from "@/lib/prisma"
import { requirePermission, requireRole } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { logActivity } from "@/lib/activity-log"

export async function createProduct(formData: FormData) {
  const session = await requireRole("ADMIN", "STAFF")
  const isStaff = session.user.role === "STAFF"

  const sku = formData.get("sku") as string
  const name = formData.get("name") as string
  const unit = (formData.get("unit") as string) || "pcs"
  const description = (formData.get("description") as string) || ""
  const category = (formData.get("category") as string) || ""
  
  const costPriceUSD = isStaff ? 0 : parseFloat(formData.get("costPriceUSD") as string) || 0
  const sellPriceUSD = isStaff ? 0 : parseFloat(formData.get("sellPriceUSD") as string) || 0
  const initialStock = parseInt(formData.get("initialStock") as string) || 0

  let createdProduct: any

  await prisma.$transaction(async (tx) => {
    createdProduct = await tx.product.create({
      data: {
        sku,
        name,
        unit,
        description,
        category,
        costPriceUSD,
        sellPriceUSD,
        currentStock: initialStock,
        costPrice: 0 // قيمة احتياطية في حال كان الحقل القديم لا يزال موجوداً
      },
    })

    if (initialStock > 0) {
      await tx.stockMovement.create({
        data: {
          productId: createdProduct.id,
          type: "STOCK_IN",
          quantity: initialStock,
          reason: "Initial stock entry",
        },
      })
    }
  })

  await logActivity({
    userId: session.user.id,
    action: "CREATE",
    entityType: "Product",
    entityId: createdProduct.id,
    entityName: createdProduct.name,
  })

  revalidatePath("/products")
  redirect("/products")
}

export async function createProductWithFeedback(prevState: any, formData: FormData) {
  try {
    const session = await auth()
    if (!session) return { error: "غير مصرح لك بالوصول." }

    const sku = formData.get("sku") as string
    const name = formData.get("name") as string
    const unit = (formData.get("unit") as string) || "pcs"
    const description = (formData.get("description") as string) || ""
    const category = (formData.get("category") as string) || ""
    
    // ✅ Capture new fields
    const power = formData.get("power") ? parseFloat(formData.get("power") as string) : null
    const volt = formData.get("volt") ? parseFloat(formData.get("volt") as string) : null
    
    const costPriceUSD = parseFloat(formData.get("costPriceUSD") as string) || 0
    const sellPriceUSD = parseFloat(formData.get("sellPriceUSD") as string) || 0
    const initialStock = parseInt(formData.get("currentStock") as string) || 0

    let createdProduct: any

    await prisma.$transaction(async (tx) => {
      createdProduct = await tx.product.create({
        data: { 
          sku, 
          name, 
          unit, 
          description, 
          category,
          power,       // ✅ Added
          volt,        // ✅ Added
          costPriceUSD,
          sellPriceUSD,
          currentStock: initialStock,
          costPrice: 0
        },
      })

      if (initialStock > 0) {
        await tx.stockMovement.create({
          data: { 
            productId: createdProduct.id, 
            type: "STOCK_IN", 
            quantity: initialStock, 
            reason: "Initial stock entry" 
          },
        })
      }
    })
    
    await logActivity({
      userId: session.user.id,
      action: "CREATE",
      entityType: "Product",
      entityId: createdProduct.id,
      entityName: createdProduct.name,
    })
    
  } catch (error: any) {
    if (error.message === "NEXT_REDIRECT") throw error;
    if (error.code === "P2002") return { error: "رمز المنتج (SKU) هذا موجود بالفعل. يرجى استخدام رمز فريد." }
    console.error("❌ Create Product Error:", error)
    return { error: `فشل حفظ المنتج: ${error.message || "خطأ غير معروف"}` }
  }
  
  redirect("/products")
}

export async function updateProduct(prevState: any, formData: FormData) {
  try {
    const session = await auth()
    if (!session) return { error: "غير مصرح لك بالوصول." }

    const productId = formData.get("productId") as string
    const sku = formData.get("sku") as string
    const name = formData.get("name") as string
    const unit = (formData.get("unit") as string) || "pcs"
    const description = (formData.get("description") as string) || ""
    const category = (formData.get("category") as string) || ""
    const currentStock = parseInt(formData.get("currentStock") as string) || 0
    
    // ✅ Capture new fields
    const power = formData.get("power") ? parseFloat(formData.get("power") as string) : null
    const volt = formData.get("volt") ? parseFloat(formData.get("volt") as string) : null
    
    const costPriceUSD = parseFloat(formData.get("costPriceUSD") as string) || 0
    const sellPriceUSD = parseFloat(formData.get("sellPriceUSD") as string) || 0

    const oldProduct = await prisma.product.findUnique({ where: { id: productId } })
    if (!oldProduct) return { error: "المنتج غير موجود" }

    await prisma.product.update({
      where: { id: productId },
      data: {
        sku,
        name,
        unit,
        description,
        category,
        power,       // ✅ Added
        volt,        // ✅ Added
        currentStock,
        costPriceUSD,
        sellPriceUSD,
        costPrice: 0
      }
    })

    await logActivity({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "Product",
      entityId: productId,
      entityName: name,
      details: "تم تحديث بيانات المنتج",
    })

  } catch (error: any) {
    if (error.code === "P2002") return { error: "رمز المنتج (SKU) هذا موجود بالفعل." }
    console.error("❌ Update Product Error:", error)
    return { error: `فشل تحديث المنتج: ${error.message || "خطأ غير معروف"}` }
  }

  revalidatePath("/products")
  redirect("/products")
}

export async function adjustStock(prevState: { error: string | null }, formData: FormData) {
  const session = await auth()
  if (!session) return { error: "غير مصرح لك بالوصول." }
  await requirePermission("canAdjustStock")

  const productId = formData.get("productId") as string
  const type = formData.get("type") as "STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT"
  const quantity = parseInt(formData.get("quantity") as string)
  const reason = formData.get("reason") as string

  if (!productId || !quantity || quantity <= 0) {
    return { error: "الكمية يجب أن تكون أكبر من 0" }
  }

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) return { error: "المنتج غير موجود" }

  const stockChange = type === "STOCK_IN" ? quantity : -quantity
  const newStock = product.currentStock + stockChange

  // ✅ Prevent negative stock
  if (newStock < 0) {
    return { 
      error: `لا يمكن تطبيق هذا التعديل. المخزون الحالي هو ${product.currentStock} ${product.unit}. سيؤدي هذا إلى مخزون سالب (${newStock}).` 
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.create({
      data: { 
        productId, 
        type, 
        quantity, 
        reason,
        userId: session.user.id
      },
    })
    await tx.product.update({
      where: { id: productId },
      data: { currentStock: { increment: stockChange } },
    })
  })

  await logActivity({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "Product",
    entityId: productId,
    entityName: product.name,
    details: `${type === "STOCK_IN" ? "إضافة" : "خصم"} مخزون بمقدار ${quantity}. السبب: ${reason}`,
  })

  revalidatePath(`/products/${productId}`)
  redirect(`/products/${productId}`)
}

export async function deleteProduct(formData: FormData) {
  const session = await requirePermission("canDeleteProducts") 
  const productId = formData.get("productId") as string
  const product = await prisma.product.findUnique({ where: { id: productId } })

  const [orderItemCount, offerItemCount, poItemCount] = await Promise.all([
    prisma.orderItem.count({ where: { productId } }),
    prisma.priceOfferItem.count({ where: { productId } }),
    prisma.purchaseOrderItem.count({ where: { productId } }),
  ])

  if (orderItemCount > 0 || offerItemCount > 0 || poItemCount > 0) {
    throw new Error("لا يمكن حذف هذا المنتج. له سجلات مرتبطة في الطلبات، العروض، أو أوامر الشراء.")
  }

  await prisma.$transaction(async (tx) => {
    await tx.stockMovement.deleteMany({ where: { productId } })
    await tx.product.delete({ where: { id: productId } })
  })

  await logActivity({
    userId: session.user.id,
    action: "DELETE",
    entityType: "Product",
    entityId: productId,
    entityName: product?.name || "منتج",
  })

  revalidatePath("/products")
}


function generateSNRange(fromSN: string, toSN: string): string[] {
  const start = parseInt(fromSN, 10)
  const end = parseInt(toSN, 10)
  
  if (isNaN(start) || isNaN(end)) {
    throw new Error("يجب أن تكون الأرقام التسلسلية أرقاماً صحيحة (مثل: 98743511)")
  }
  if (start > end) {
    throw new Error("رقم البداية يجب أن يكون أصغر من أو يساوي رقم النهاية")
  }
  
  const snLength = fromSN.length // Preserve leading zeros (e.g., "001" to "010")
  const sns: string[] = []
  
  for (let i = start; i <= end; i++) {
    sns.push(i.toString().padStart(snLength, '0'))
  }
  
  return sns
}

export async function addSerialNumbers(prevState: any, formData: FormData) {
  const session = await auth()
  if (!session) return { error: "غير مصرح" }
  await requirePermission("canAdjustStock") // Or canEditProducts

  const productId = formData.get("productId") as string
  const fromSN = (formData.get("fromSN") as string).trim()
  const toSN = (formData.get("toSN") as string).trim()

  if (!fromSN || !toSN) return { error: "يجب إدخال رقم البداية والنهاية" }

  try {
    // 1. Generate the list of SNs
    const snsToAdd = generateSNRange(fromSN, toSN)
    const quantityToAdd = snsToAdd.length

    if (quantityToAdd > 1000) {
      return { error: "الحد الأقصى للإضافة في مرة واحدة هو 1000 رقم تسلسلي" }
    }

    // 2. Check for duplicates in the database
    const existingSNs = await prisma.serialNumber.findMany({
      where: { serialNumber: { in: snsToAdd } },
      select: { serialNumber: true }
    })

    if (existingSNs.length > 0) {
      const duplicates = existingSNs.map(s => s.serialNumber).join(", ")
      return { error: `الأرقام التسلسلية التالية موجودة مسبقاً: ${duplicates}` }
    }

    // 3. Add to database in a transaction
    await prisma.$transaction(async (tx) => {
      // Create all serial numbers
      await tx.serialNumber.createMany({
        data: snsToAdd.map(sn => ({
          productId,
          serialNumber: sn,
          status: "IN_STOCK",
          addedAt: new Date()
        }))
      })

      // Update main product stock count
      await tx.product.update({
        where: { id: productId },
        data: { currentStock: { increment: quantityToAdd } }
      })

      // Log stock movement
      await tx.stockMovement.create({
        data: {
          productId,
          type: "STOCK_IN",
          quantity: quantityToAdd,
          reason: `إضافة أرقام تسلسلية من ${fromSN} إلى ${toSN}`,
          userId: session.user.id
        }
      })
    })

    await logActivity({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "Product",
      entityId: productId,
      entityName: "تحديث مخزون",
      details: `إضافة ${quantityToAdd} رقم تسلسلي (${fromSN} - ${toSN})`,
    })

  } catch (error: any) {
    console.error("Add SN error:", error)
    return { error: error.message || "فشل إضافة الأرقام التسلسلية" }
  }

  revalidatePath(`/products/${productId}`)
  return { error: null, success: true }
}