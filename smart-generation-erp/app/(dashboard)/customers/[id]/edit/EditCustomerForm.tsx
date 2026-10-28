"use client"

import { useState } from "react"
import { updateCustomer } from "../../actions"
import Link from "next/link"
import { Plus, Trash2 } from "lucide-react"

interface Contact {
  name: string
  jobTitle: string
  phone: string
}

export default function EditCustomerForm({ customer }: { customer: any }) {
  const [error, setError] = useState<string | null>(null)
  const [contacts, setContacts] = useState<Contact[]>(
  customer.contacts && customer.contacts.length > 0 
    ? customer.contacts.map((c: any) => ({
        name: c.name || "",
        jobTitle: c.jobTitle || "",
        phone: c.phone || ""
      }))
    : []
)

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
    <form 
        action={async (formData) => {
            // ✅ Pass null as the first argument (prevState)
            const result = await updateCustomer(null, formData)
            if (result?.error) setError(result.error)
        }}
        className="space-y-6 rounded-lg border bg-white p-6 shadow-sm"
        >
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          ⚠️ {error}
        </div>
      )}

      <input type="hidden" name="customerId" value={customer.id} />

      {/* Basic Info */}
      <div>
        <h3 className="text-sm font-bold text-[#061228] mb-3 border-b pb-2">البيانات الأساسية</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">اسم العميل *</label>
            <input name="name" defaultValue={customer.name} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">البريد الإلكتروني</label>
            <input name="email" type="email" defaultValue={customer.email || ""} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">رقم الهاتف</label>
            <input name="phone" defaultValue={customer.phone || ""} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">المنطقة / المدينة</label>
            <input name="area" defaultValue={customer.area || ""} placeholder="مثال: القاهرة الجديدة" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">مجال العمل</label>
            <input name="fieldOfWork" defaultValue={customer.fieldOfWork || ""} placeholder="مثال: تجارة، مقاولات، صناعة..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">العنوان التفصيلي</label>
            <textarea name="address" defaultValue={customer.address || ""} rows={2} placeholder="الشارع، رقم المبنى، الطابق..." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">النسبة المئوية الافتراضية (%)</label>
            <input 
              name="defaultPercentage" 
              type="number" 
              step="0.01"
              defaultValue={customer.defaultPercentage}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" 
            />
            <p className="mt-1 text-xs text-gray-500">قيمة موجبة = ربح إضافي، قيمة سالبة = خصم</p>
          </div>
        </div>
      </div>

      {/* Contacts Section */}
      <div>
        <div className="flex items-center justify-between mb-3 border-b pb-2">
          <h3 className="text-sm font-bold text-[#061228]">جهات الاتصال داخل الشركة</h3>
          <button 
            type="button" 
            onClick={addContact}
            className="inline-flex items-center gap-1 rounded-lg bg-[#061228] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#0a1d40] transition"
          >
            <Plus size={14} /> إضافة جهة اتصال
          </button>
        </div>

        {contacts.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            لا توجد جهات اتصال. اضغط على "إضافة جهة اتصال" لإضافة شخص للتواصل داخل الشركة.
          </p>
        ) : (
          <div className="space-y-4">
            {contacts.map((contact, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 rounded-lg border border-gray-200 bg-gray-50 relative">
                <div className="md:col-span-4">
                  <label className="mb-1 block text-xs font-medium text-gray-600">الاسم *</label>
                  <input 
                    name={`contactName_${index}`}
                    value={contact.name}
                    onChange={(e) => updateContact(index, "name", e.target.value)}
                    required
                    placeholder="اسم الشخص"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" 
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="mb-1 block text-xs font-medium text-gray-600">المسمى الوظيفي</label>
                  <input 
                    name={`contactTitle_${index}`}
                    value={contact.jobTitle}
                    onChange={(e) => updateContact(index, "jobTitle", e.target.value)}
                    placeholder="مثال: مدير مشتريات"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" 
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="mb-1 block text-xs font-medium text-gray-600">رقم الهاتف</label>
                  <div className="flex gap-2">
                    <input 
                      name={`contactPhone_${index}`}
                      value={contact.phone}
                      onChange={(e) => updateContact(index, "phone", e.target.value)}
                      placeholder="01xxxxxxxxx"
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" 
                    />
                    <button 
                      type="button"
                      onClick={() => removeContact(index)}
                      className="flex items-center justify-center rounded-lg border border-red-300 bg-white px-2 text-red-600 hover:bg-red-50 transition"
                      title="حذف جهة الاتصال"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 border-t pt-6">
        <Link href={`/customers/${customer.id}`} className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">إلغاء</Link>
        <button type="submit" className="rounded-lg bg-[#dda322] px-6 py-2 text-sm font-medium text-white hover:bg-[#b8861b] transition shadow-sm">
          حفظ التعديلات
        </button>
      </div>
    </form>
  )
}