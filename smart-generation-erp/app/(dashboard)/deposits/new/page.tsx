import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import NewDepositForm from "./NewDepositForm"

export default async function NewDepositPage() {
  await requirePermission("canManageDeposits")
  
  const productsRaw = await prisma.product.findMany({ orderBy: { name: "asc" } })
  

  const products = productsRaw.map(p => ({
    ...p,
    costPrice: p.costPrice ? p.costPrice.toNumber() : 0, // ✅ Safe fallback for null
    costPriceUSD: p.costPriceUSD.toNumber(),
    sellPriceUSD: p.sellPriceUSD.toNumber(),
  }))

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/deposits" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#dda322] transition mb-2">
          <ArrowRight size={16} /> العودة إلى الأمانات
        </Link>
        <h1 className="text-2xl font-bold text-[#061228]">تسجيل أمانة جديدة</h1>
        <p className="mt-1 text-sm text-gray-500">تسجيل منتج تم إخراجه كأمانة لشركة أو شخص.</p>
      </div>
      <NewDepositForm products={products} />
    </div>
  )
}