import { prisma } from "@/lib/prisma"
import type { NotificationType } from "@prisma/client"

interface NotifyOptions {
  type: NotificationType
  title: string
  message: string
  link?: string
  entityType?: string
  entityId?: string
  actorId?: string
}

/**
 * Notify a specific user directly
 */
export async function notifyUser(userId: string, options: NotifyOptions) {
  // Don't notify yourself
  if (options.actorId && options.actorId === userId) return
  
  await prisma.notification.create({
    data: {
      userId,
      type: options.type,
      title: options.title,
      message: options.message,
      link: options.link,
      entityType: options.entityType,
      entityId: options.entityId,
      actorId: options.actorId,
    }
  })
}

/**
 * Notify ALL users who have a specific permission set to true
 * Perfect for "notify all approvers" scenarios
 */
export async function notifyUsersWithPermission(
  permission: string,
  options: NotifyOptions & { excludeUserIds?: string[] }
) {
  const { excludeUserIds = [], ...notifyOptions } = options
  
  // Find all users with this permission enabled
  const permissions = await prisma.permission.findMany({
    where: { [permission]: true },
    select: { userId: true }
  })
  
  let userIds = permissions.map(p => p.userId)
  
  // Exclude specific users (e.g., the person who triggered the action)
  if (excludeUserIds.length > 0) {
    userIds = userIds.filter(id => !excludeUserIds.includes(id))
  }
  
  if (userIds.length === 0) return { notified: 0 }
  
  // Bulk create for efficiency
  await prisma.notification.createMany({
    data: userIds.map(userId => ({
      userId,
      type: notifyOptions.type,
      title: notifyOptions.title,
      message: notifyOptions.message,
      link: notifyOptions.link,
      entityType: notifyOptions.entityType,
      entityId: notifyOptions.entityType ? notifyOptions.entityId : undefined,
      actorId: notifyOptions.actorId,
    }))
  })
  
  return { notified: userIds.length }
}

/**
 * Get notification metadata (icon, color) for UI rendering
 */
export function getNotificationMeta(type: NotificationType) {
  const meta: Record<NotificationType, { icon: string; color: string; bgColor: string }> = {
    // Price Offers
    PRICE_OFFER_SUBMITTED: { icon: "Clock", color: "text-yellow-600", bgColor: "bg-yellow-100" },
    PRICE_OFFER_APPROVED: { icon: "CheckCircle", color: "text-green-600", bgColor: "bg-green-100" },
    PRICE_OFFER_REJECTED: { icon: "XCircle", color: "text-red-600", bgColor: "bg-red-100" },
    
    // Purchase Orders
    PURCHASE_ORDER_SUBMITTED: { icon: "Clock", color: "text-yellow-600", bgColor: "bg-yellow-100" },
    PURCHASE_ORDER_APPROVED: { icon: "CheckCircle", color: "text-green-600", bgColor: "bg-green-100" },
    PURCHASE_ORDER_REJECTED: { icon: "XCircle", color: "text-red-600", bgColor: "bg-red-100" },
    
    // Invoices
    INVOICE_PAID: { icon: "DollarSign", color: "text-green-600", bgColor: "bg-green-100" },
    
    // Leaves
    LEAVE_REQUESTED: { icon: "Calendar", color: "text-blue-600", bgColor: "bg-blue-100" },
    LEAVE_APPROVED: { icon: "CheckCircle", color: "text-green-600", bgColor: "bg-green-100" },
    LEAVE_REJECTED: { icon: "XCircle", color: "text-red-600", bgColor: "bg-red-100" },
    
    // Deposits
    DEPOSIT_OUT: { icon: "ArrowUpCircle", color: "text-purple-600", bgColor: "bg-purple-100" },
    DEPOSIT_RETURNED: { icon: "ArrowDownCircle", color: "text-green-600", bgColor: "bg-green-100" },
    DEPOSIT_SOLD: { icon: "ShoppingCart", color: "text-orange-600", bgColor: "bg-orange-100" },
    
    // Custodies
    CUSTODY_OUT: { icon: "ArrowUpCircle", color: "text-purple-600", bgColor: "bg-purple-100" },
    CUSTODY_RETURNED: { icon: "ArrowDownCircle", color: "text-green-600", bgColor: "bg-green-100" },
    CUSTODY_SOLD: { icon: "ShoppingCart", color: "text-orange-600", bgColor: "bg-orange-100" },
    
    // System
    SYSTEM: { icon: "Bell", color: "text-gray-600", bgColor: "bg-gray-100" },
  }
  
  return meta[type] || meta.SYSTEM
}