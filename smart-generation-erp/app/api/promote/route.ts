import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 })
  }

  // Force update the current user's role to SUPER_ADMIN
  await prisma.user.update({
    where: { id: session.user.id },
    data: { role: "SUPER_ADMIN" }
  })

  return NextResponse.json({ 
    success: true, 
    message: `Success! ${session.user.email} is now a SUPER_ADMIN. Please log out and log back in.` 
  })
}