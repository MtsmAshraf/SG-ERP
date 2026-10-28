import { prisma } from "@/lib/prisma"
import { headers } from "next/headers"
import { ActivityAction } from "@prisma/client"

interface LogActivityParams {
  userId?: string | null
  action: ActivityAction
  entityType: string
  entityId?: string | null
  entityName?: string | null
  details?: string | null
}

export async function logActivity({
  userId,
  action,
  entityType,
  entityId,
  entityName,
  details,
}: LogActivityParams) {
  try {
    const headersList = await headers()
    const ipAddress = 
      headersList.get("x-forwarded-for")?.split(",")[0] || 
      headersList.get("x-real-ip") || 
      null

    await prisma.activityLog.create({
      data: {
        userId: userId || null,
        action,
        entityType,
        entityId: entityId || null,
        entityName: entityName || null,
        details: details || null,
        ipAddress,
      },
    })
  } catch (error) {
    console.error("Failed to log activity:", error)
  }
}