import { prisma } from "@/lib/prisma"

export async function getCurrencySymbol() {
  const settings = await prisma.companySettings.findUnique({
    where: { id: "global_settings" },
    select: { currencySymbol: true }
  })
  return settings?.currencySymbol || "$"
}