import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import EditCustomerForm from "./EditCustomerForm"

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("canEditCustomers")
  const { id } = await params

  const customer = await prisma.customer.findUnique({ 
    where: { id },
    include: { contacts: { orderBy: { createdAt: "asc" } } }
  })
  if (!customer) notFound()

  // ✅ Explicitly pick fields and convert ALL Decimal fields to plain numbers
  const customerData = {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    area: customer.area,
    fieldOfWork: customer.fieldOfWork,
    defaultPercentage: customer.defaultPercentage ? customer.defaultPercentage.toNumber() : 0,
    // ✅ Convert salePercentage if it exists in your schema
    salePercentage: (customer as any).salePercentage ? (customer as any).salePercentage.toNumber() : 0,
    contacts: customer.contacts.map(c => ({
      name: c.name,
      jobTitle: c.jobTitle || "",
      phone: c.phone || ""
    }))
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href={`/customers/${id}`} className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#dda322] transition mb-2">
          <ArrowRight size={16} /> العودة إلى تفاصيل العميل
        </Link>
        <h1 className="text-2xl font-bold text-[#061228]">تعديل بيانات العميل</h1>
        <p className="mt-1 text-sm text-gray-500">تحديث معلومات العميل وجهات الاتصال.</p>
      </div>
      <EditCustomerForm customer={customerData} />
    </div>
  )
}