import { prisma } from "@/lib/prisma"
import { requirePermission, getUserPermissions } from "@/lib/auth-utils"
import { auth } from "@/auth"
import Link from "next/link"
import { getCurrencySymbol } from "@/lib/settings"
import { getUsdToEgpRate } from "@/lib/usd-rate"
import { Eye } from "lucide-react"
import { DeletePriceOfferButton } from "./DeletePriceOfferButton"

export default async function PriceOffersPage() {
  await requirePermission("canViewPriceOffers")
  const session = await auth()
  const permissions = await getUserPermissions()
  
  if (!session) return null
  
  const currency = await getCurrencySymbol()
  const usdRate = await getUsdToEgpRate()

  // ✅ Users with canViewAllPriceOffers OR canApprovePriceOffers can see ALL offers
  // Others only see their own offers
  const canViewAll = permissions?.canViewAllPriceOffers || permissions?.canApprovePriceOffers
  const where = canViewAll ? {} : { createdById: session.user.id }

  const offers = await prisma.priceOffer.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { 
      customer: true,
      createdBy: { select: { name: true } }
    }
  })

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-800",
      PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      CONVERTED_TO_ORDER: "bg-blue-100 text-blue-800",
    }
    return styles[status] || "bg-gray-100 text-gray-800"
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: "مسودة",
      PENDING_APPROVAL: "قيد الاعتماد",
      APPROVED: "معتمد",
      REJECTED: "مرفوض",
      CONVERTED_TO_ORDER: "تم التحويل",
    }
    return labels[status] || status
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#061228]">عروض الأسعار</h1>
        {permissions?.canCreatePriceOffers && (
          <Link href="/price-offers/new" className="rounded bg-[#dda322] px-4 py-2 text-sm font-medium text-white hover:bg-[#b8861b] transition">
            + عرض جديد
          </Link>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="overflow-x-auto force-ltr">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">رقم العرض</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">العميل</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">تم الإنشاء بواسطة</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">التاريخ</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">الإجمالي (EGP)</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {offers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">لا توجد عروض أسعار.</td>
                </tr>
              ) : (
                offers.map((offer) => (
                  <tr key={offer.id} className="hover:bg-gray-50 transition">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-gray-900">{offer.offerNumber}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <Link href={`/customers/${offer.customer.id}`} className="text-[#061228] hover:text-[#dda322] transition">
                        {offer.customer.name}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{offer.createdBy.name}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{offer.createdAt.toLocaleDateString('ar-EG')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[#dda322]">
                      {(offer.total.toNumber() * usdRate).toFixed(2)} EGP
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadge(offer.status)}`}>
                        {getStatusLabel(offer.status)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/price-offers/${offer.id}`} className="text-[#061228] hover:text-[#dda322] p-1 rounded hover:bg-gray-100 transition" title="عرض التفاصيل">
                          <Eye size={18} />
                        </Link>
                        {permissions?.canDeletePriceOffers && (
                          <DeletePriceOfferButton offerId={offer.id} offerNumber={offer.offerNumber} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}