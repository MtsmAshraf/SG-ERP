import { prisma } from "@/lib/prisma"
import { requirePermission, getUserPermissions } from "@/lib/auth-utils"
import { auth } from "@/auth"
import { notFound } from "next/navigation"
import { 
  addOfferItem, 
  removeOfferItem, 
  submitOfferForApproval, 
  approveOffer, 
  rejectOffer, 
  convertOfferToSalesOrder 
} from "../actions"
import Link from "next/link"
import { AddOfferItemForm } from "../AddOfferItemForm"
import { getUsdToEgpRate } from "@/lib/usd-rate"
import { Warehouse, AlertTriangle } from "lucide-react"

export default async function PriceOfferDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("canViewPriceOffers")
  const session = await auth()
  const permissions = await getUserPermissions()
  const { id } = await params
  const usdRate = await getUsdToEgpRate()

  const offer = await prisma.priceOffer.findUnique({
    where: { id },
    include: {
      customer: true,
      createdBy: { select: { name: true } },
      approvedBy: { select: { name: true } },
      items: { include: { product: true } }
    }
  })
  if (!offer) notFound()

  const productsRaw = await prisma.product.findMany({ orderBy: { name: "asc" } })
  const products = productsRaw.map(p => ({
    ...p,
    costPrice: p.costPrice ? p.costPrice.toNumber() : 0,
    costPriceUSD: p.costPriceUSD.toNumber(),
    sellPriceUSD: p.sellPriceUSD.toNumber(),
  }))

  const offerData = {
    ...offer,
    total: offer.total.toNumber(),
    defaultPercentage: offer.defaultPercentage ? offer.defaultPercentage.toNumber() : 0
  }

  const isDraft = offer.status === "DRAFT"
  const isPending = offer.status === "PENDING_APPROVAL"
  const isApproved = offer.status === "APPROVED"
  const isRejected = offer.status === "REJECTED"
  const isConverted = offer.status === "CONVERTED_TO_ORDER"
  const isCreator = offer.createdById === session?.user?.id

  const canEdit = isDraft && (permissions?.canCreatePriceOffers || isCreator)
  const canSubmit = isDraft && offerData.total > 0 && (permissions?.canCreatePriceOffers || isCreator)
  const canApproveReject = isPending && permissions?.canApprovePriceOffers
  const canConvert = isApproved && (permissions?.canConvertPriceOffers || isCreator)

  // ✅ Fetch current stock for all products in the offer (only if user can approve)
  const stockLevels: Record<string, number> = {}
  if (canApproveReject) {
    for (const item of offer.items) {
      const product = await prisma.product.findUnique({ 
        where: { id: item.productId },
        select: { currentStock: true }
      })
      if (product) {
        stockLevels[item.productId] = product.currentStock
      }
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link href="/price-offers" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#dda322] transition mb-2">
          ← العودة إلى عروض الأسعار
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#061228]">عرض سعر رقم {offer.offerNumber}</h1>
          <StatusBadge status={offer.status} />
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">العميل</p>
          <p className="text-lg font-semibold text-gray-900">{offer.customer.name}</p>
          {offerData.defaultPercentage !== 0 && (
            <p className={`text-xs mt-1 font-medium ${offerData.defaultPercentage > 0 ? "text-green-600" : "text-red-600"}`}>
              {offerData.defaultPercentage > 0 ? "+" : ""}{offerData.defaultPercentage}% نسبة افتراضية
            </p>
          )}
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">تم الإنشاء بواسطة</p>
          <p className="text-lg font-semibold text-gray-900">{offer.createdBy.name}</p>
          <p className="text-xs text-gray-500">{offer.createdAt.toLocaleDateString('ar-EG')}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">الإجمالي (EGP)</p>
          <p className="text-2xl font-bold text-[#dda322]">{(offerData.total * usdRate).toFixed(2)} EGP</p>
          <p className="text-xs text-gray-500">≈ ${offerData.total.toFixed(2)} USD</p>
        </div>
      </div>

      {/* Approval Info */}
      {(isApproved || isRejected) && offer.approvedBy && (
        <div className={`rounded-lg border p-4 ${isApproved ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
          <p className={`font-medium ${isApproved ? "text-green-800" : "text-red-800"}`}>
            {isApproved ? "✓ تم الاعتماد بواسطة" : "✗ تم الرفض بواسطة"} {offer.approvedBy.name}
          </p>
        </div>
      )}

      {isConverted && offer.convertedOrderNumber && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <p className="font-medium text-blue-800">
            ✓ تم التحويل إلى أمر بيع: <Link href={`/sales-orders`} className="underline font-bold">{offer.convertedOrderNumber}</Link>
          </p>
        </div>
      )}

      {offer.notes && (
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-gray-500">ملاحظات / شروط</h3>
          <p className="text-gray-700 whitespace-pre-line">{offer.notes}</p>
        </div>
      )}

      {/* Items Table */}
      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <div className="border-b bg-gray-50 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#061228]">عناصر العرض</h2>
        </div>
        
        {canEdit && (
          <div className="p-6 border-b">
            <AddOfferItemForm 
              offerId={offer.id} 
              products={products} 
              defaultPercentage={offerData.defaultPercentage}
              usdRate={usdRate} 
            />
          </div>
        )}

        <div className="overflow-x-auto force-ltr">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">المنتج</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الكمية</th>
                {/* ✅ Show stock column only for users with approval permission */}
                {canApproveReject && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-1">
                      المخزون المتاح
                    </div>
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">سعر الوحدة (EGP)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الإجمالي (EGP)</th>
                {canEdit && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">إجراءات</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {offer.items.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? (canApproveReject ? 7 : 6) : (canApproveReject ? 6 : 5)} className="px-6 py-8 text-center text-sm text-gray-500">
                    لم تتم إضافة أي عناصر بعد.
                  </td>
                </tr>
              ) : (
                offer.items.map((item: any) => {
                  const currentStock = stockLevels[item.productId]
                  const isStockInsufficient = canApproveReject && currentStock !== undefined && currentStock < item.quantity

                  return (
                    <tr key={item.id} className={`hover:bg-gray-50 transition ${isStockInsufficient ? 'bg-red-50' : ''}`}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{item.product.name}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{item.product.sku}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{item.quantity}</td>
                      
                      {/* ✅ Show stock level with warning if insufficient */}
                      {canApproveReject && (
                        <td className="whitespace-nowrap px-6 py-4 text-sm">
                          {currentStock !== undefined ? (
                            <div className={`flex items-center gap-1 ${isStockInsufficient ? 'text-red-600 font-bold' : 'text-gray-700'}`}>
                              {isStockInsufficient && <AlertTriangle size={14} className="text-red-600" />}
                              <span>{currentStock}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      )}
                      
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">
                        {(item.unitPrice.toNumber() * usdRate).toFixed(2)} EGP
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-[#dda322]">
                        {(item.lineTotal.toNumber() * usdRate).toFixed(2)} EGP
                      </td>
                      {canEdit && (
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                          <form action={removeOfferItem}>
                            <input type="hidden" name="itemId" value={item.id} />
                            <input type="hidden" name="priceOfferId" value={offer.id} />
                            <button type="submit" className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition" title="حذف">
                              Remove
                            </button>
                          </form>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {canSubmit && (
          <form action={submitOfferForApproval}>
            <input type="hidden" name="priceOfferId" value={offer.id} />
            <button type="submit" className="rounded-lg bg-yellow-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-yellow-700 shadow-sm transition">
              إرسال للاعتماد
            </button>
          </form>
        )}
        {canApproveReject && (
          <>
            <form action={approveOffer}>
              <input type="hidden" name="priceOfferId" value={offer.id} />
              <button type="submit" className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700 shadow-sm transition">
                ✓ اعتماد العرض
              </button>
            </form>
            <form action={rejectOffer}>
              <input type="hidden" name="priceOfferId" value={offer.id} />
              <button type="submit" className="rounded-lg bg-red-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-red-700 shadow-sm transition">
                ✗ رفض العرض
              </button>
            </form>
          </>
        )}
        {canConvert && (
          <form action={convertOfferToSalesOrder}>
            <input type="hidden" name="priceOfferId" value={offer.id} />
            <button type="submit" className="rounded-lg bg-[#dda322] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#b8861b] shadow-sm transition">
              تحويل إلى أمر بيع ←
            </button>
          </form>
        )}
      </div>

      {isPending && !canApproveReject && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center text-yellow-800">
          هذا العرض قيد انتظار اعتماد الإدارة. ستتمكن من تحويله إلى أمر بيع بعد الاعتماد.
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    CONVERTED_TO_ORDER: "bg-blue-100 text-blue-800",
  }
  const label: Record<string, string> = {
    DRAFT: "مسودة",
    PENDING_APPROVAL: "قيد الاعتماد",
    APPROVED: "معتمد",
    REJECTED: "مرفوض",
    CONVERTED_TO_ORDER: "تم التحويل لأمر بيع",
  }
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${styles[status] || "bg-gray-100 text-gray-800"}`}>
      {label[status] || status}
    </span>
  )
}