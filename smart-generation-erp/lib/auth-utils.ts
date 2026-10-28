import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Role } from "@prisma/client"
import { prisma } from "./prisma"

export async function requireRole(...allowedRoles: Role[]) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  
  // ✅ CRITICAL FIX: SUPER_ADMIN bypasses all specific role checks
  if ((session.user.role as Role) === "SUPER_ADMIN") {
    return session
  }

  if (!allowedRoles.includes(session.user.role as Role)) {
    throw new Error("You don't have permission to access this page")
  }
  return session
}

export async function requirePermission(permissionKey: keyof import("@prisma/client").Permission) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  
  // ✅ SUPER_ADMIN bypasses database permission checks
  if ((session.user.role as Role) === "SUPER_ADMIN") {
    return session
  }
  
  const permission = await prisma.permission.findUnique({
    where: { userId: session.user.id }
  })
  
  if (!permission || !permission[permissionKey]) {
    redirect("/dashboard")
  }
  
  return session
}

export async function getUserPermissions() {
  const session = await auth()
  if (!session?.user) return null
  
  // ✅ SUPER_ADMIN gets all permissions hardcoded
  if ((session.user.role as Role) === "SUPER_ADMIN") {
    return {
      canViewDashboard: true, canViewProducts: true, canViewCustomers: true,
      canViewSuppliers: true, canViewPurchaseOrders: true, canViewPriceOffers: true,
      canViewSalesOrders: true, canViewUsers: true, canCreateProducts: true,
      canEditProducts: true, canDeleteProducts: true, canAdjustStock: true,
      canCreateCustomers: true, canEditCustomers: true, canCreateSuppliers: true,
      canEditSuppliers: true, canCreatePurchaseOrders: true, canApprovePurchaseOrders: true,
      canConfirmPurchaseOrders: true, canCreatePriceOffers: true, canApprovePriceOffers: true,
      canConvertPriceOffers: true, canCreateSalesOrders: true, canConfirmSalesOrders: true,
      canCreateUsers: true, canDeleteUsers: true, canExportData: true,
      canViewHR: true,
      canManageEmployees: true,
      canManageLeaves: true,
      canManagePayroll: true,
      canManageSettings: true,
      canViewReports: true,
      canViewActivityLog: true,
      canViewDeposits: true, canManageDeposits: true,
      canViewCustodies: true, canManageCustodies: true,
      canManageUsdRate: true,
      canDeleteCustomers: true, 
      canDeleteEmployees: true, canEditEmployees: true,
      canViewEmployees: true,
      canDeletePriceOffers: true,
      canDeleteSuppliers: true,
      canViewInvoices: true,
      canViewAllPriceOffers: true,
      canManageInvoices: true
    }
  }
  
  // For regular users, fetch from database
  return await prisma.permission.findUnique({
    where: { userId: session.user.id }
  })
}

export async function canManageUser(targetUserId: string, currentUserId: string, currentRole: Role): Promise<boolean> {
  if (targetUserId === currentUserId) return false
  const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } })
  if (!targetUser) return false
  
  if (currentRole === "SUPER_ADMIN") return true
  if (currentRole === "ADMIN") return targetUser.role !== "SUPER_ADMIN"
  
  return false
}