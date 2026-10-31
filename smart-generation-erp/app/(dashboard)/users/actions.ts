"use server"

import { prisma } from "@/lib/prisma"
import { requireRole, canManageUser, requirePermission } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { hash } from "bcryptjs"
import { auth } from "@/auth"
import { logActivity } from "@/lib/activity-log"

export async function createUser(formData: FormData) {
  const session = await requireRole("SUPER_ADMIN", "ADMIN")
  
  if (session.user.role !== "SUPER_ADMIN") {
    const permission = await prisma.permission.findUnique({
      where: { userId: session.user.id }
    })
    if (!permission?.canCreateUsers) {
      throw new Error("You don't have permission to create users")
    }
  }
  
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const role = formData.get("role") as "SUPER_ADMIN" | "ADMIN" | "STAFF"

  if (role === "SUPER_ADMIN" && session.user.role !== "SUPER_ADMIN") {
    throw new Error("Only Super Admins can create other Super Admins")
  }

  const hashedPassword = await hash(password, 10)

  try {
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role }
    })

    const defaultPermissions = role === "SUPER_ADMIN" || role === "ADMIN"
      ? {
          canViewDashboard: true, canViewProducts: true, canViewCustomers: true, canViewSuppliers: true,
          canViewPurchaseOrders: true, canViewPriceOffers: true, canViewSalesOrders: true, canViewUsers: true,
          canCreateProducts: true, canEditProducts: true, canDeleteProducts: true, canAdjustStock: true,
          canCreateCustomers: true, canEditCustomers: true, canCreateSuppliers: true, canEditSuppliers: true,
          canCreatePurchaseOrders: true, canApprovePurchaseOrders: true,
          canConfirmPurchaseOrders: true, canCreatePriceOffers: true, canApprovePriceOffers: true,
          canConvertPriceOffers: true, canCreateSalesOrders: true, canConfirmSalesOrders: true,
          canCreateUsers: true, canDeleteUsers: true,
          canExportData: true, canViewHR: true, canManageEmployees: true, canManageLeaves: true, canManagePayroll: true,
          canManageSettings: true, canViewReports: true, canViewActivityLog: true,
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
          canManageInvoices: true,
          canViewWarehouse: true,
          canManageWarehouse: true,
          canViewAllCustomers: true,
          canViewMaintenance: true,
          canManageMaintenance: true

        }
      : {
          canViewDashboard: true, canViewProducts: true, canViewCustomers: true, canViewSuppliers: true,
          canViewPurchaseOrders: true, canViewPriceOffers: true, canViewSalesOrders: true, canViewUsers: false,
          canCreateProducts: false, canEditProducts: false, canDeleteProducts: false, canAdjustStock: false,
          canCreateCustomers: true, canEditCustomers: true, canCreateSuppliers: false, canEditSuppliers: false,
          canCreatePurchaseOrders: false, canApprovePurchaseOrders: false, canConfirmPurchaseOrders: false,
          canCreatePriceOffers: true, canApprovePriceOffers: false, canConvertPriceOffers: true, canCreateSalesOrders: false,
          canConfirmSalesOrders: true, canCreateUsers: false, canDeleteUsers: false, canExportData: true,
          canViewHR: false, canManageEmployees: false, canManageLeaves: false, canManagePayroll: false,
          canManageSettings: false, canViewReports: false, canViewActivityLog: false,
          canViewDeposits: false, canManageDeposits: false,
          canViewCustodies: false, canManageCustodies: false,
          canManageUsdRate: false, canDeleteCustomers: false,
          canDeleteEmployees: false, canEditEmployees: false,
          canViewEmployees: false,
          canDeletePriceOffers: false,
          canDeleteSuppliers: false,
          canViewInvoices: false,
          canViewAllPriceOffers: false,
          canManageInvoices: false,
          canViewWarehouse: false,
          canManageWarehouse: false,
          canViewAllCustomers: false,
          canViewMaintenance: false,
          canManageMaintenance: false

        }

    await prisma.permission.create({
      data: { userId: user.id, ...defaultPermissions }
    })

    await logActivity({
      userId: session.user.id,
      action: "CREATE",
      entityType: "User",
      entityId: user.id,
      entityName: user.name,
      details: `تم إنشاء مستخدم جديد بالدور: ${role}`,
    })

  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new Error("A user with this email already exists.")
    }
    throw error
  }

  revalidatePath("/users")
  redirect("/users")
}

export async function updateUserPermissions(prevState: any, formData: FormData) {
  const session = await requireRole("SUPER_ADMIN", "ADMIN")
  const targetUserId = formData.get("userId") as string
  
  const canManage = await canManageUser(targetUserId, session.user.id, session.user.role as "SUPER_ADMIN" | "ADMIN" | "STAFF")
  if (!canManage) {
    return { success: false, error: "ليس لديك صلاحية لتعديل هذا المستخدم" }
  }

  const permissionData = {
    canViewDashboard: formData.get("canViewDashboard") === "on",
    canViewProducts: formData.get("canViewProducts") === "on",
    canViewCustomers: formData.get("canViewCustomers") === "on",
    canViewSuppliers: formData.get("canViewSuppliers") === "on",
    canViewPurchaseOrders: formData.get("canViewPurchaseOrders") === "on",
    canViewPriceOffers: formData.get("canViewPriceOffers") === "on",
    canViewSalesOrders: formData.get("canViewSalesOrders") === "on",
    canViewUsers: formData.get("canViewUsers") === "on",
    canCreateProducts: formData.get("canCreateProducts") === "on",
    canViewAllPriceOffers: formData.get("canViewAllPriceOffers") === "on", 
    canEditProducts: formData.get("canEditProducts") === "on",
    canDeleteProducts: formData.get("canDeleteProducts") === "on",
    canAdjustStock: formData.get("canAdjustStock") === "on",
    canCreateCustomers: formData.get("canCreateCustomers") === "on",
    canEditCustomers: formData.get("canEditCustomers") === "on",
    canCreateSuppliers: formData.get("canCreateSuppliers") === "on",
    canEditSuppliers: formData.get("canEditSuppliers") === "on",
    canCreatePurchaseOrders: formData.get("canCreatePurchaseOrders") === "on",
    canApprovePurchaseOrders: formData.get("canApprovePurchaseOrders") === "on",
    canConfirmPurchaseOrders: formData.get("canConfirmPurchaseOrders") === "on",
    canCreatePriceOffers: formData.get("canCreatePriceOffers") === "on",
    canApprovePriceOffers: formData.get("canApprovePriceOffers") === "on",
    canConvertPriceOffers: formData.get("canConvertPriceOffers") === "on",
    canCreateSalesOrders: formData.get("canCreateSalesOrders") === "on",
    canConfirmSalesOrders: formData.get("canConfirmSalesOrders") === "on",
    canCreateUsers: formData.get("canCreateUsers") === "on",
    canDeleteUsers: formData.get("canDeleteUsers") === "on",
    canExportData: formData.get("canExportData") === "on",
    canViewHR: formData.get("canViewHR") === "on",
    canManageEmployees: formData.get("canManageEmployees") === "on",
    canManageLeaves: formData.get("canManageLeaves") === "on",
    canManagePayroll: formData.get("canManagePayroll") === "on",
    canManageSettings: formData.get("canManageSettings") === "on",
    canViewReports: formData.get("canViewReports") === "on",
    canViewActivityLog: formData.get("canViewActivityLog") === "on",
    canViewDeposits: formData.get("canViewDeposits") === "on",
    canManageDeposits: formData.get("canManageDeposits") === "on",
    canViewCustodies: formData.get("canViewCustodies") === "on",
    canManageCustodies: formData.get("canManageCustodies") === "on",
    canManageUsdRate: formData.get("canManageUsdRate") === "on",
    canDeleteCustomers: formData.get("canDeleteCustomers") === "on",
    canDeleteEmployees: formData.get("canDeleteEmployees") === "on",
    canEditEmployees: formData.get("canEditEmployees") === "on",
    canViewEmployees: formData.get("canViewEmployees") === "on",
    canDeletePriceOffers: formData.get("canDeletePriceOffers") === "on",
    canDeleteSuppliers: formData.get("canDeleteSuppliers") === "on",
    canManageInvoices: formData.get("canManageInvoices") === "on",
    canViewInvoices: formData.get("canViewInvoices") === "on",
    canViewAllInvoices: formData.get("canViewAllInvoices") === "on",
    canViewWarehouse: formData.get("canViewWarehouse") === "on",
    canManageWarehouse: formData.get("canManageWarehouse") === "on",
    canViewAllCustomers: formData.get("canViewAllCustomers") === "on",
    canViewMaintenance: formData.get("canViewMaintenance") === "on",
    canManageMaintenance: formData.get("canManageMaintenance") === "on",
  }

  try {
    await prisma.permission.upsert({
      where: { userId: targetUserId },
      update: permissionData,
      create: { userId: targetUserId, ...permissionData }
    })

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } })
    await logActivity({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "User",
      entityId: targetUserId,
      entityName: targetUser?.name || "مستخدم",
      details: `تم تعديل صلاحيات المستخدم`,
    })

    revalidatePath("/users")
    revalidatePath(`/users/${targetUserId}/permissions`)
    
    return { success: true, error: null, message: "تم حفظ الصلاحيات بنجاح." }
  } catch (error) {
    console.error("Update permissions error:", error)
    return { success: false, error: "فشل حفظ الصلاحيات. يرجى المحاولة مرة أخرى.", message: null }
  }
}

export async function deactivateUser(prevState: any, formData: FormData) {
  "use server"
  const session = await requirePermission("canDeleteUsers")
  const userId = formData.get("userId") as string

  if (userId === session.user.id) {
    return { success: false, error: "لا يمكنك تعطيل حسابك الخاص.", message: null }
  }

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } })

    if (targetUser?.role === "ADMIN" || targetUser?.role === "SUPER_ADMIN") {
      return { success: false, error: "لا يمكن تعطيل حسابات المدراء لضمان استمرار الوصول للنظام.", message: null }
    }

    await prisma.user.update({ where: { id: userId }, data: { isActive: false } })
    
    await logActivity({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "User",
      entityId: userId,
      entityName: targetUser?.name || "مستخدم",
      details: `تم تعطيل حساب المستخدم`,
    })
    
    revalidatePath("/users")
    return { success: true, error: null, message: "تم تعطيل المستخدم بنجاح." }
  } catch (error) {
    console.error("Deactivate user error:", error)
    return { success: false, error: "فشل تعطيل المستخدم.", message: null }
  }
}

export async function reactivateUser(prevState: any, formData: FormData) {
  "use server"
  const session = await requirePermission("canDeleteUsers")
  const userId = formData.get("userId") as string

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } })
    await prisma.user.update({ where: { id: userId }, data: { isActive: true } })
    
    await logActivity({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "User",
      entityId: userId,
      entityName: targetUser?.name || "مستخدم",
      details: `تم إعادة تفعيل حساب المستخدم`,
    })
    
    revalidatePath("/users")
    return { success: true, error: null, message: "تم إعادة تفعيل المستخدم بنجاح." }
  } catch (error) {
    console.error("Reactivate user error:", error)
    return { success: false, error: "فشل إعادة تفعيل المستخدم.", message: null }
  }
}