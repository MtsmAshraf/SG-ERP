"use client"

import { useState } from "react"
import { Printer, Download, X } from "lucide-react"

export function PrintWarehouseButton({ activeView }: { activeView: string }) {
  const [isOpen, setIsOpen] = useState(false)

  const handlePrint = (type: string) => {
    const printUrl = `/warehouse/print?type=${type}`
    window.open(printUrl, "_blank")
    setIsOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-[#061228] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a1f3d] transition shadow-sm"
      >
        <Printer size={16} />
        طباعة / تصدير PDF
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#061228]">طباعة المخزون</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handlePrint("warehouse")}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-right hover:bg-gray-50 transition flex items-center justify-between"
              >
                <span className="font-medium text-gray-900">المخزن الرئيسي</span>
                <Printer size={18} className="text-gray-500" />
              </button>

              <button
                onClick={() => handlePrint("deposits")}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-right hover:bg-gray-50 transition flex items-center justify-between"
              >
                <span className="font-medium text-gray-900">الودائع</span>
                <Printer size={18} className="text-gray-500" />
              </button>

              <button
                onClick={() => handlePrint("custodies")}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-right hover:bg-gray-50 transition flex items-center justify-between"
              >
                <span className="font-medium text-gray-900">العهد</span>
                <Printer size={18} className="text-gray-500" />
              </button>

              <div className="border-t pt-2 mt-2">
                <button
                  onClick={() => handlePrint("all")}
                  className="w-full rounded-lg bg-[#dda322] px-4 py-3 text-right hover:bg-[#b8861b] transition flex items-center justify-between text-white"
                >
                  <span className="font-medium">طباعة الكل</span>
                  <Download size={18} />
                </button>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800">
                💡 سيتم فتح صفحة الطباعة في نافذة جديدة. استخدم Ctrl+P (أو Cmd+P على Mac) لحفظ الملف كـ PDF.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}