import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  const [recent, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        actor: { select: { name: true } }
      }
    }),
    prisma.notification.count({
      where: { userId: session.user.id, read: false }
    })
  ])
  
  return NextResponse.json({
    notifications: recent,
    unreadCount
  })
}