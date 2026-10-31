import { prisma } from "@/lib/prisma"
import { requirePermission, getUserPermissions } from "@/lib/auth-utils"
import { auth } from "@/auth"
import { notFound } from "next/navigation"
import { removePOItem, submitPOForApproval, approvePO, rejectPO, confirmPurchaseOrder } from "../actions"
import { AddPOItemForm } from "../AddPOItemForm"
import Link from "next/link"

export default async function PurchaseOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("canViewPurchaseOrders")
  const session = await auth()
  const permissions = await getUserPermissions()
  const { id } = await params

  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      createdBy: { select: { name: true } },
      approvedBy: { select: { name: true } },
      items: {
        include: { product: true }
      }
    }
  })

  if (!po) notFound()

  const productsRaw = await prisma.product.findMany({ orderBy: { name: "asc" } })

  // ✅ Explicitly convert ALL Decimal fields to plain JS Numbers to prevent Client Component crashes
  const products = productsRaw.map(p => ({
    ...p,
    costPrice: p.costPrice ? p.costPrice.toNumber() : 0,
    costPriceUSD: p.costPriceUSD.toNumber(),
    sellPriceUSD: p.sellPriceUSD.toNumber(),
  }))

  const isDraft = po.status === "DRAFT"
  const isPending = po.status === "PENDING_APPROVAL"
  const isApproved = po.status === "APPROVED"
  const isRejected = po.status === "REJECTED"
  const isConfirmed = po.status === "CONFIRMED"

  // ✅ Granular permission checks + creator fallback
  const isCreator = po.createdById === session?.user?.id
  const canEdit = isDraft && (permissions?.canCreatePurchaseOrders || isCreator)
  const canSubmit = isDraft && po.total.toNumber() > 0 && (permissions?.canCreatePurchaseOrders || isCreator)
  const canApproveReject = isPending && permissions?.canApprovePurchaseOrders
  const canConfirm = isApproved && permissions?.canConfirmPurchaseOrders

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href="/purchase-orders" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#dda322] transition mb-2">
          ← العودة إلى أوامر الشراء
        </Link>
        <div className="mt-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#061228]">أمر شراء رقم {po.poNumber}</h1>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${
            po.status === "DRAFT" ? "bg-gray-100 text-gray-800" : 
            po.status === "PENDING_APPROVAL" ? "bg-yellow-100 text-yellow-800" : 
            po.status === "APPROVED" ? "bg-blue-100 text-blue-800" : 
            po.status === "REJECTED" ? "bg-red-100 text-red-800" : 
            po.status === "CONFIRMED" ? "bg-green-100 text-green-800" : 
            "bg-gray-100 text-gray-800"
          }`}>
            {po.status === "DRAFT" ? "مسودة" : 
             po.status === "PENDING_APPROVAL" ? "قيد الاعتماد" : 
             po.status === "APPROVED" ? "معتمد" : 
             po.status === "REJECTED" ? "مرفوض" : 
             po.status === "CONFIRMED" ? "مؤكد" : po.status}
          </span>
        </div>
      </div>

      {/* Approval Info */}
      {(isApproved || isRejected) && po.approvedBy && (
        <div className={`rounded-lg border p-4 ${isApproved ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
          <p className={`font-medium ${isApproved ? "text-green-800" : "text-red-800"}`}>
            {isApproved ? "✓ تم الاعتماد بواسطة" : "✗ تم الرفض بواسطة"} {po.approvedBy.name}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">المورد</p>
          <p className="text-lg font-semibold text-gray-900">
            <Link href={`/suppliers/${po.supplier.id}`} className="text-[#061228] hover:text-[#dda322] transition">
              {po.supplier.name}
            </Link>
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">تم الإنشاء بواسطة</p>
          <p className="text-lg font-semibold text-gray-900">{po.createdBy.name}</p>
          <p className="text-xs text-gray-500">{po.createdAt.toLocaleDateString('ar-EG')}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <p className="text-sm text-gray-500">إجمالي التكلفة</p>
          <p className="text-2xl font-bold text-[#dda322]">{po.total.toNumber().toFixed(2)} EGP</p>
        </div>
      </div>

      {po.notes && (
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-gray-500">ملاحظات</h3>
          <p className="text-gray-700 whitespace-pre-line">{po.notes}</p>
        </div>
      )}

      {/* Items Section with 100% Responsive Horizontal Scrolling */}
      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <div className="border-b bg-gray-50 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#061228]">العناصر</h2>
        </div>
        
        {canEdit && (
          <div className="p-6 border-b">
            <AddPOItemForm purchaseOrderId={po.id} />
          </div>
        )}

        {isPending && !canApproveReject && (
          <div className="border-b bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">قيد الاعتماد:</span> أمر الشراء هذا في انتظار موافقة الإدارة. التعديل مقفل حالياً.
            </p>
          </div>
        )}

        {/* ✅ Responsive Table Wrapper: overflow-x-auto + force-ltr */}
        <div className="overflow-x-auto force-ltr">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">المنتج</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الكمية</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">سعر الوحدة</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الإجمالي</th>
                {canEdit && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">إجراءات</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {po.items.length === 0 ? (
                <tr>
                  <td colSpan={canEdit ? 6 : 5} className="px-6 py-8 text-center text-sm text-gray-500">
                    لم تتم إضافة أي عناصر بعد.
                  </td>
                </tr>
              ) : (
                po.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {item.productName || item.product?.name || "منتج غير معروف"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {item.product?.sku || "—"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                      {item.quantity} {item.unit || item.product?.unit || ""}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">{item.unitCost.toNumber().toFixed(2)} EGP</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900">{item.lineTotal.toNumber().toFixed(2)} EGP</td>
                    {canEdit && (
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                        <form action={removePOItem}>
                          <input type="hidden" name="itemId" value={item.id} />
                          <input type="hidden" name="purchaseOrderId" value={po.id} />
                          <button type="submit" className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition" title="حذف">
                            Remove
                          </button>
                        </form>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {/* Submit for Approval */}
        {canSubmit && (
          <form action={submitPOForApproval}>
            <input type="hidden" name="purchaseOrderId" value={po.id} />
            <button type="submit" className="rounded-lg bg-yellow-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-yellow-700 shadow-sm transition">
              إرسال للاعتماد
            </button>
          </form>
        )}

        {/* Approve / Reject (Permission-based, when pending) */}
        {canApproveReject && (
          <>
            <form action={approvePO}>
              <input type="hidden" name="purchaseOrderId" value={po.id} />
              <button type="submit" className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700 shadow-sm transition">
                ✓ اعتماد أمر الشراء
              </button>
            </form>
            <form action={rejectPO}>
              <input type="hidden" name="purchaseOrderId" value={po.id} />
              <button type="submit" className="rounded-lg bg-red-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-red-700 shadow-sm transition">
                ✗ رفض أمر الشراء
              </button>
            </form>
          </>
        )}

        {/* Confirm & Receive Stock (Permission-based, when approved) */}
        {canConfirm && (
          <form action={confirmPurchaseOrder}>
            <input type="hidden" name="purchaseOrderId" value={po.id} />
            <button type="submit" className="rounded-lg bg-[#dda322] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#b8861b] shadow-sm transition">
              تأكيد واستلام المخزون
            </button>
          </form>
        )}
      </div>

      {/* Pending message for users without approval permissions */}
      {isPending && !canApproveReject && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center text-yellow-800">
          أمر الشراء هذا قيد انتظار موافقة الإدارة. ستتمكن من تأكيده بعد الاعتماد.
        </div>
      )}

      {isConfirmed && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center text-green-800">
          ✓ تم تأكيد أمر الشراء هذا وتم استلام المخزون.
        </div>
      )}
    </div>
  )
}