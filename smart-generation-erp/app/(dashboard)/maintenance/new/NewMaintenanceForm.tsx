"use client"

import { useActionState, useState, useEffect } from "react"
import { createMaintenance } from "../actions"
import Link from "next/link"
import { Plus, Trash2 } from "lucide-react"

interface Product {
  id: string
  name: string
  sku: string
  serialNumbers: { id: string; serialNumber: string }[]
}

interface Customer {
  id: string
  name: string
}

interface SalesOrder {
  id: string
  orderNumber: string
}

export default function NewMaintenanceForm({
  products,
  customers,
  salesOrders
}: {
  products: Product[]
  customers: Customer[]
  salesOrders: SalesOrder[]
}) {
  const [state, formAction, isPending] = useActionState(createMaintenance, null)
  
  const [items, setItems] = useState<{
    productId: string
    serialNumberId: string
    quantity: number
    issueDescription: string
  }[]>([{ productId: "", serialNumberId: "", quantity: 1, issueDescription: "" }])

  const addItem = () => {
    setItems([...items, { productId: "", serialNumberId: "", quantity: 1, issueDescription: "" }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    if (field === "productId") {
      updated[index].serialNumberId = "" // Reset SN when product changes
    }
    setItems(updated)
  }

  const getAvailableSerialNumbers = (productId: string) => {
    const product = products.find(p => p.id === productId)
    return product?.serialNumbers || []
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#061228]">طلب صيانة جديد</h1>
        <p className="mt-1 text-sm text-gray-500">تسجيل منتج مرتجع للصيانة.</p>
      </div>

      <form action={formAction} className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
        {state?.error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            ⚠️ {state.error}
          </div>
        )}

        {/* Customer & Sales Order */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">العميل (اختياري)</label>
            <select name="customerId" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]">
              <option value="">-- اختر عميل --</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">أمر البيع الأصلي (اختياري)</label>
            <select name="salesOrderId" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]">
              <option value="">-- اختر أمر بيع --</option>
              {salesOrders.map(so => <option key={so.id} value={so.id}>{so.orderNumber}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">تاريخ الإرجاع المتوقع للإكمال</label>
            <input name="expectedCompletionDate" type="date" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]" />
          </div>
        </div>

        {/* Products Section */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#061228]">المنتجات المرتجعة</h2>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
            >
              <Plus size={16} /> إضافة منتج
            </button>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => {
              const availableSNs = getAvailableSerialNumbers(item.productId)
              return (
                <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 border rounded-lg bg-gray-50">
                  <div className="md:col-span-3">
                    <label className="mb-1 block text-xs font-medium text-gray-700">المنتج *</label>
                    <select
                      value={item.productId}
                      onChange={(e) => updateItem(index, "productId", e.target.value)}
                      name={`productId_${index}`}
                      required
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]"
                    >
                      <option value="">-- اختر منتج --</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="mb-1 block text-xs font-medium text-gray-700">الرقم التسلسلي (SN)</label>
                    <select
                      value={item.serialNumberId}
                      onChange={(e) => updateItem(index, "serialNumberId", e.target.value)}
                      name={`serialNumberId_${index}`}
                      disabled={!item.productId}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322] disabled:bg-gray-100"
                    >
                      <option value="">-- اختر SN --</option>
                      {availableSNs.map(sn => <option key={sn.id} value={sn.id}>{sn.serialNumber}</option>)}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">اختياري لكن مفضل</p>
                  </div>
                  <div className="md:col-span-1">
                    <label className="mb-1 block text-xs font-medium text-gray-700">الكمية</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                      name={`quantity_${index}`}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <label className="mb-1 block text-xs font-medium text-gray-700">وصف المشكلة *</label>
                    <input
                      type="text"
                      value={item.issueDescription}
                      onChange={(e) => updateItem(index, "issueDescription", e.target.value)}
                      name={`issue_${index}`}
                      required
                      placeholder="مثال: لا يعمل، صوت غريب..."
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]"
                    />
                  </div>
                  <div className="md:col-span-1 flex items-end">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="حذف"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">ملاحظات إضافية</label>
          <textarea name="notes" rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]" />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t pt-6">
          <Link href="/maintenance" className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
            إلغاء
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-[#dda322] px-6 py-2 text-sm font-medium text-white hover:bg-[#b8861b] transition shadow-sm disabled:opacity-50"
          >
            {isPending ? "جاري الحفظ..." : "تسجيل طلب الصيانة"}
          </button>
        </div>
      </form>
    </div>
  )
}