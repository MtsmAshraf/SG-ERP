"use client"

import { useActionState, useEffect, useState } from "react"
import { updateCompanySettings } from "./actions"
import { CheckCircle2, XCircle, X } from "lucide-react"

interface Settings {
  companyName: string
  logoUrl: string | null
  address: string | null
  phone: string | null
  email: string | null
  taxRate: any
  currencySymbol: string
  usdToEgpRate: number
}

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, formAction, isPending] = useActionState(updateCompanySettings, null)
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    if (state) {
      setShowToast(true)
      const timer = setTimeout(() => setShowToast(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [state])

  return (
    <>
      {/* Floating Toast */}
      {showToast && state && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 rounded-xl border px-5 py-4 shadow-2xl transition-all ${
          state.success ? "border-green-200 bg-white text-green-800" : "border-red-200 bg-white text-red-800"
        }`}>
          {state.success ? <CheckCircle2 className="h-6 w-6 text-green-500" /> : <XCircle className="h-6 w-6 text-red-500" />}
          <div className="flex-1">
            <p className="text-sm font-bold">{state.success ? "تمت العملية بنجاح" : "حدث خطأ"}</p>
            <p className="text-xs mt-0.5 opacity-90">{state.message || state.error}</p>
          </div>
          <button onClick={() => setShowToast(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
      )}

      <form action={formAction} className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">اسم الشركة *</label>
            <input name="companyName" required defaultValue={settings.companyName} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
          </div>
          
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">رابط شعار الشركة (URL)</label>
            <input name="logoUrl" type="url" defaultValue={settings.logoUrl || ""} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" placeholder="https://example.com/logo.png" />
            <p className="mt-1 text-xs text-gray-500">الصق رابط مباشر لصورة الشعار (PNG أو SVG بخلفية شفافة).</p>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">العنوان</label>
            <textarea name="address" rows={2} defaultValue={settings.address || ""} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">رقم الهاتف</label>
            <input name="phone" defaultValue={settings.phone || ""} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">البريد الإلكتروني</label>
            <input name="email" type="email" defaultValue={settings.email || ""} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">نسبة الضريبة (%)</label>
            <input name="taxRate" type="number" step="0.01" min="0" defaultValue={Number(settings.taxRate)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">رمز العملة</label>
            <input name="currencySymbol" defaultValue={settings.currencySymbol} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">سعر الصرف (USD إلى EGP)</label>
            <input name="usdToEgpRate" type="number" step="0.01" min="0" defaultValue={Number(settings.usdToEgpRate)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-[#dda322] focus:ring-1 focus:ring-[#dda322] outline-none transition" />
            <p className="mt-1 text-xs text-gray-500">سعر الدولار بالجنيه المصري</p>
          </div>
        </div>

        <div className="flex justify-end border-t pt-6">
          <button type="submit" disabled={isPending} className="rounded-lg bg-[#dda322] px-6 py-2 text-sm font-medium text-white hover:bg-[#b8861b] transition shadow-sm disabled:opacity-50">
            {isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
          </button>
        </div>
      </form>
    </>
  )
}