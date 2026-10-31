import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    console.log('🔄 Starting warehouse sync...')

    // Find all confirmed PO items that are custom (productId is null)
    const customItems = await prisma.purchaseOrderItem.findMany({
      where: {
        productId: null,
        purchaseOrder: {
          status: 'CONFIRMED'
        }
      },
      include: {
        purchaseOrder: {
          select: { poNumber: true }
        }
      }
    })

    console.log(`Found ${customItems.length} custom items from confirmed POs`)

    let created = 0
    let updated = 0
    const results: string[] = []

    for (const item of customItems) {
      const itemName = item.productName || 'بند مخصص'
      const itemUnit = item.unit || 'pcs'

      // Check if this item already exists in warehouse
      const existing = await prisma.warehouseCustomItem.findFirst({
        where: {
          name: itemName,
          unit: itemUnit
        }
      })

      if (existing) {
        // Update existing item
        await prisma.warehouseCustomItem.update({
          where: { id: existing.id },
          data: { quantity: { increment: item.quantity } }
        })

        await prisma.warehouseCustomItemMovement.create({
          data: {
            warehouseCustomItemId: existing.id,
            type: 'IN',
            quantity: item.quantity,
            reason: `مزامنة من أمر الشراء ${item.purchaseOrder.poNumber}`,
          }
        })

        updated++
        results.push(`✅ Updated: ${itemName} (+${item.quantity} ${itemUnit})`)
      } else {
        // Create new item
        const newItem = await prisma.warehouseCustomItem.create({
          data: {
            name: itemName,
            unit: itemUnit,
            quantity: item.quantity,
            notes: `مستلم من أمر الشراء ${item.purchaseOrder.poNumber}`
          }
        })

        await prisma.warehouseCustomItemMovement.create({
          data: {
            warehouseCustomItemId: newItem.id,
            type: 'IN',
            quantity: item.quantity,
            reason: `مزامنة أولية من أمر الشراء ${item.purchaseOrder.poNumber}`,
          }
        })

        created++
        results.push(`✅ Created: ${itemName} (${item.quantity} ${itemUnit})`)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Sync complete!',
      stats: {
        totalFound: customItems.length,
        created,
        updated
      },
      details: results
    })
  } catch (error: any) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}