import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getUserPermissions } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma"
import DashboardClientLayout from "./dashboard/DashboardClientLayout"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  // 1. Fetch Permissions
  const permissions = await getUserPermissions()

  // 2. Fetch Company Settings
  const settings = await prisma.companySettings.findUnique({ 
    where: { id: "global_settings" } 
  })

  const companyData = settings ? {
    name: settings.companyName,
    logo: settings.logoUrl,
    currency: settings.currencySymbol
  } : { 
    name: "Smart Generation ERP", 
    logo: null, 
    currency: "$" 
  }

  // 3. Pass everything to the Client Layout
  return (
    <DashboardClientLayout 
      userName={session.user.name || "مستخدم"} 
      permissions={permissions}
      companyData={companyData}
    >
      {children}
    </DashboardClientLayout>
  )
}