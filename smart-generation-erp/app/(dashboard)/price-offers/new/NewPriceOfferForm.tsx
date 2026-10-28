"use client"

import { useState } from "react"
import { createPriceOffer } from "../actions"
import Link from "next/link"

export default function NewPriceOfferForm({ customers }: { customers: any[] }) {
  const [selectedPercentage, setSelectedPercentage] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const customerId = e.target.value
    const customer = customers.find(c => c.id === customerId)
    if (customer) {
      setSelectedPercentage(customer.defaultPercentage)
    }
  }

  return (
    <form 
      action={async (formData) => {
        const result = await createPriceOffer(formData)
        if (result?.error) {
          setError(result.error)
        }
      }}
      className="space-y-6 rounded-lg border bg-white p-6 shadow-sm"
    >
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          ⚠️ {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">العميل *</label>
          <select 
            name="customerId" 
            required 
            onChange={handleCustomerChange}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition"
          >
            <option value="">اختر عميلاً...</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.defaultPercentage !== 0 && ` (${c.defaultPercentage > 0 ? '+' : ''}${c.defaultPercentage}%)`}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">النسبة المئوية الافتراضية (%)</label>
          <input 
            name="defaultPercentage" 
            type="number" 
            step="0.01"
            value={selectedPercentage}
            onChange={(e) => setSelectedPercentage(parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" 
          />
          <p className="mt-1 text-xs text-gray-500">
            قيمة موجبة = ربح إضافي، قيمة سالبة = خصم، صفر = سعر البيع العادي
          </p>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">ملاحظات</label>
          <textarea 
            name="notes" 
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" 
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 border-t pt-6">
        <Link href="/price-offers" className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">إلغاء</Link>
        <button 
          type="submit"
          className="rounded-lg bg-[#dda322] px-6 py-2 text-sm font-medium text-white hover:bg-[#b8861b] transition shadow-sm"
        >
          إنشاء العرض
        </button>
      </div>
    </form>
  )
}