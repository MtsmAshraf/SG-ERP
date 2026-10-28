import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import { SettingsForm } from "./SettingsForm"

export default async function SettingsPage() {
  await requirePermission("canManageSettings")

  const dbSettings = await prisma.companySettings.findUnique({ 
    where: { id: "global_settings" } 
  })

  // ✅ Convert ALL Prisma Decimals to plain JS Numbers
  const settings = dbSettings ? {
    ...dbSettings,
    taxRate: dbSettings.taxRate.toNumber(),
    usdToEgpRate: dbSettings.usdToEgpRate.toNumber()
  } : {
    companyName: "Smart Generation ERP",
    logoUrl: "",
    address: "",
    phone: "",
    email: "",
    taxRate: 0,
    currencySymbol: "$",
    usdToEgpRate: 50
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#061228]">إعدادات الشركة</h1>
        <p className="mt-1 text-sm text-gray-500">إدارة البيانات الأساسية للشركة والتي ستظهر في الفواتير والتقارير.</p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  )
}