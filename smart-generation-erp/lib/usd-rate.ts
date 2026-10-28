import { prisma } from "@/lib/prisma"

export async function getUsdToEgpRate() {
  const settings = await prisma.companySettings.findUnique({
    where: { id: "global_settings" },
    select: { usdToEgpRate: true }
  })
  return settings?.usdToEgpRate.toNumber() || 50
}