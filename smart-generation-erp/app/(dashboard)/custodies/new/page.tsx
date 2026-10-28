import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import NewCustodyForm from "./NewCustodyForm"

export default async function NewCustodyPage() {
  await requirePermission("canManageCustodies")
  
  const [productsRaw, employeesRaw] = await Promise.all([
    prisma.product.findMany({ orderBy: { name: "asc" } }),
    prisma.employee.findMany({ 
      where: { status: "ACTIVE" },
      orderBy: { firstName: "asc" } 
    })
  ])

  const products = productsRaw.map(p => ({
    ...p,
    costPrice: p.costPrice ? p.costPrice.toNumber() : 0, // ✅ Safe fallback for null
    costPriceUSD: p.costPriceUSD.toNumber(),
    sellPriceUSD: p.sellPriceUSD.toNumber(),
  }))

  // ✅ Convert Prisma Decimal to plain JS Number for employees
  const employees = employeesRaw.map(e => ({
    ...e,
    basicSalary: e.basicSalary.toNumber()
  }))

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/custodies" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#dda322] transition mb-2">
          <ArrowRight size={16} /> العودة إلى العهد
        </Link>
        <h1 className="text-2xl font-bold text-[#061228]">تسجيل عهدة جديدة</h1>
        <p className="mt-1 text-sm text-gray-500">تسجيل منتج تم إخراجه كعهدة لموظف خارج الشركة.</p>
      </div>
      <NewCustodyForm products={products} employees={employees} />
    </div>
  )
}