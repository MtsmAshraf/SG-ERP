"use server"

import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"
import { logActivity } from "@/lib/activity-log"

export async function updateCompanySettings(prevState: any, formData: FormData) {
  const session = await requirePermission("canManageSettings")
  const settingsId = "global_settings"

  try {
    await prisma.companySettings.upsert({
      where: { id: settingsId },
      update: {
        companyName: formData.get("companyName") as string,
        logoUrl: (formData.get("logoUrl") as string) || null,
        address: (formData.get("address") as string) || null,
        phone: (formData.get("phone") as string) || null,
        email: (formData.get("email") as string) || null,
        taxRate: parseFloat(formData.get("taxRate") as string) || 0,
        currencySymbol: formData.get("currencySymbol") as string || "$",
        usdToEgpRate: parseFloat(formData.get("usdToEgpRate") as string) || 50,
      },
      create: {
        id: settingsId,
        companyName: formData.get("companyName") as string,
        logoUrl: (formData.get("logoUrl") as string) || null,
        address: (formData.get("address") as string) || null,
        phone: (formData.get("phone") as string) || null,
        email: (formData.get("email") as string) || null,
        taxRate: parseFloat(formData.get("taxRate") as string) || 0,
        currencySymbol: formData.get("currencySymbol") as string || "$",
        usdToEgpRate: parseFloat(formData.get("usdToEgpRate") as string) || 50,
      },
    })

    await logActivity({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "CompanySettings",
      entityName: formData.get("companyName") as string,
      details: `تم تحديث إعدادات الشركة`,
    })

    revalidatePath("/settings")
    return { success: true, error: null, message: "تم حفظ إعدادات الشركة بنجاح." }
  } catch (error) {
    console.error("Update settings error:", error)
    return { success: false, error: "فشل حفظ الإعدادات.", message: null }
  }
}