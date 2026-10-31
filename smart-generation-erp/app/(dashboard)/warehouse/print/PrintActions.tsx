"use client"

import { Package, X } from "lucide-react"

export function PrintActions() {
  return (
    <div className="no-print mb-4 flex justify-between items-center">
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-lg bg-[#dda322] px-6 py-2 text-sm font-medium text-white hover:bg-[#b8861b] transition shadow-sm"
      >
        <Package size={16} />
        طباعة / حفظ كـ PDF
      </button>
      <button
        onClick={() => window.close()}
        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
      >
        إغلاق
      </button>
    </div>
  )
}