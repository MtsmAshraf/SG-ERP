"use client"

import { useActionState, useState } from "react"
import { createCustomer } from "../actions"
import Link from "next/link"
import { Plus, Trash2 } from "lucide-react"

interface Contact {
  name: string
  jobTitle: string
  phone: string
}

export default function NewCustomerPage() {
  const [state, formAction, isPending] = useActionState(createCustomer, null)
  const [contacts, setContacts] = useState<Contact[]>([])

  const addContact = () => {
    setContacts([...contacts, { name: "", jobTitle: "", phone: "" }])
  }

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index))
  }

  const updateContact = (index: number, field: keyof Contact, value: string) => {
    const updated = [...contacts]
    updated[index][field] = value
    setContacts(updated)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#061228]">إضافة عميل جديد</h1>
        <p className="mt-1 text-sm text-gray-500">أدخل بيانات العميل الجديد وجهات الاتصال الخاصة به.</p>
      </div>

      <form action={formAction} className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
        {/* Error Message */}
        {state?.error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            ⚠️ {state.error}
          </div>
        )}

        {/* Main Info */}
        <div>
          <h2 className="text-lg font-bold text-[#061228] mb-4">البيانات الأساسية</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">اسم العميل *</label>
              <input name="name" required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">البريد الإلكتروني</label>
              <input name="email" type="email" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">رقم الهاتف</label>
              <input name="phone" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">المنطقة / المدينة</label>
              <input name="area" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">مجال العمل</label>
              <input name="fieldOfWork" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">العنوان</label>
              <textarea name="address" rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">النسبة المئوية الافتراضية (%)</label>
              <input 
                name="defaultPercentage" 
                type="number" 
                step="0.01"
                defaultValue="0"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" 
              />
              <p className="mt-1 text-xs text-gray-500">
                قيمة موجبة = ربح إضافي، قيمة سالبة = خصم، صفر = سعر البيع العادي
              </p>
            </div>
          </div>
        </div>

        {/* Contacts Section */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#061228]">جهات الاتصال داخل الشركة</h2>
            <button
              type="button"
              onClick={addContact}
              className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
            >
              <Plus size={16} /> إضافة جهة اتصال
            </button>
          </div>

          {contacts.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4 border border-dashed rounded-lg">
              لم تتم إضافة أي جهات اتصال بعد.
            </p>
          )}

          <div className="space-y-4">
            {contacts.map((contact, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 border rounded-lg bg-gray-50">
                <div className="md:col-span-4">
                  <label className="mb-1 block text-xs font-medium text-gray-700">الاسم *</label>
                  <input 
                    name={`contactName_${index}`} 
                    required 
                    value={contact.name}
                    onChange={(e) => updateContact(index, 'name', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" 
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="mb-1 block text-xs font-medium text-gray-700">المسمى الوظيفي</label>
                  <input 
                    name={`contactTitle_${index}`} 
                    value={contact.jobTitle}
                    onChange={(e) => updateContact(index, 'jobTitle', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" 
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="mb-1 block text-xs font-medium text-gray-700">رقم الهاتف</label>
                  <input 
                    name={`contactPhone_${index}`} 
                    value={contact.phone}
                    onChange={(e) => updateContact(index, 'phone', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" 
                  />
                </div>
                <div className="md:col-span-1 flex items-end">
                  <button
                    type="button"
                    onClick={() => removeContact(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="حذف"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 border-t pt-6">
          <Link href="/customers" className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">إلغاء</Link>
          <button 
            type="submit" 
            disabled={isPending}
            className="rounded-lg bg-[#dda322] px-6 py-2 text-sm font-medium text-white hover:bg-[#b8861b] transition shadow-sm disabled:opacity-50"
          >
            {isPending ? "جاري الحفظ..." : "حفظ العميل"}
          </button>
        </div>
      </form>
    </div>
  )
}