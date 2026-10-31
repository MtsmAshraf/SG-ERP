"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

export async function markAsRead(formData: FormData) {
  const session = await auth()
  if (!session) return
  
  const notificationId = formData.get("notificationId") as string
  
  await prisma.notification.updateMany({
    where: { id: notificationId, userId: session.user.id },
    data: { read: true, readAt: new Date() }
  })
  
  revalidatePath("/notifications")
  revalidatePath("/", "layout")
}

export async function markAllAsRead() {
  const session = await auth()
  if (!session) return
  
  await prisma.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true, readAt: new Date() }
  })
  
  revalidatePath("/notifications")
  revalidatePath("/", "layout")
}

export async function deleteNotification(formData: FormData) {
  const session = await auth()
  if (!session) return
  
  const notificationId = formData.get("notificationId") as string
  
  await prisma.notification.deleteMany({
    where: { id: notificationId, userId: session.user.id }
  })
  
  revalidatePath("/notifications")
  revalidatePath("/", "layout")
}