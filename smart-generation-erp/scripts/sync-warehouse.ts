import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function syncWarehouse() {
  console.log('🔄 Starting warehouse sync...\n')

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

  console.log(`Found ${customItems.length} custom items from confirmed POs\n`)

  let created = 0
  let updated = 0

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
      console.log(`✅ Updated: ${itemName} (+${item.quantity} ${itemUnit})`)
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
      console.log(`✅ Created: ${itemName} (${item.quantity} ${itemUnit})`)
    }
  }

  console.log(`\n✨ Sync complete!`)
  console.log(`   Created: ${created} items`)
  console.log(`   Updated: ${updated} items`)
}

syncWarehouse()
  .catch(console.error)
  .finally(() => prisma.$disconnect())