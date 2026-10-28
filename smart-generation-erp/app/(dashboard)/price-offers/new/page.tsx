import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import NewPriceOfferForm from "./NewPriceOfferForm"

export default async function NewPriceOfferPage() {
  await requirePermission("canCreatePriceOffers")
  
  const customers = await prisma.customer.findMany({ 
    orderBy: { name: "asc" },
    select: { id: true, name: true, defaultPercentage: true }
  })

  const customersData = customers.map(c => ({
    ...c,
    defaultPercentage: c.defaultPercentage.toNumber()
  }))

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/price-offers" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#dda322] transition mb-2">
          <ArrowRight size={16} /> العودة إلى عروض الأسعار
        </Link>
        <h1 className="text-2xl font-bold text-[#061228]">إنشاء عرض سعر جديد</h1>
        <p className="mt-1 text-sm text-gray-500">إنشاء عرض سعر جديد للعميل مع نسبة الربح/الخصم الافتراضية.</p>
      </div>
      
      {/* ✅ Just render the client component, don't call the action here */}
      <NewPriceOfferForm customers={customersData} />
    </div>
  )
}