"use client"

import { Printer } from "lucide-react"

export function PrintButton() {
  return (
    <button 
      onClick={() => window.print()} 
      className="inline-flex items-center gap-2 rounded-lg bg-[#dda322] px-4 py-2 text-sm font-medium text-white hover:bg-[#b8861b] transition shadow-sm"
    >
      <Printer size={16} /> طباعة / حفظ كـ PDF
    </button>
  )
}