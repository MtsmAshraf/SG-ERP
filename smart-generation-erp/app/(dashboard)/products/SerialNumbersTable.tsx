"use client"

import { useState } from "react"
import { Search, Barcode } from "lucide-react"

export function SerialNumbersTable({ serialNumbers }: { serialNumbers: any[] }) {
  const [searchQuery, setSearchQuery] = useState("")

  // Instant client-side filtering
  const filteredSNs = serialNumbers.filter((sn) =>
    sn.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
      {/* Header with Search */}
      <div className="border-b bg-gray-50 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <Barcode size={20} className="text-[#dda322]" />
          <h2 className="text-lg font-bold text-[#061228]">الأرقام التسلسلية المتاحة في المخزن</h2>
        </div>
        
        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث برقم تسلسلي (SN)..."
            className="w-full rounded-lg border border-gray-300 py-2 pr-9 pl-3 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322] transition"
          />
        </div>
      </div>

      {/* Results Count */}
      <div className="px-6 py-2 bg-gray-50 border-b text-xs text-gray-500 flex justify-between">
        <span>عرض {filteredSNs.length} نتيجة</span>
        <span>الإجمالي: {serialNumbers.length}</span>
      </div>

      {/* Table or Empty State */}
      {filteredSNs.length === 0 ? (
        <div className="p-8 text-center text-sm text-gray-500">
          {searchQuery 
            ? "لا توجد نتائج مطابقة للبحث." 
            : "لا توجد أرقام تسلسلية مسجلة لهذا المنتج في المخزن حالياً."}
        </div>
      ) : (
        <div className="overflow-x-auto force-ltr">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الرقم التسلسلي (SN)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  تاريخ الإضافة للمخزن
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  الحالة
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSNs.map((sn) => (
                <tr key={sn.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-bold text-gray-900 tracking-wide">
                    {/* Highlight matching part if searching */}
                    {searchQuery ? (
                      <span>
                        {sn.serialNumber.split(new RegExp(`(${searchQuery})`, "gi")).map((part: string, i: number) => 
                          part.toLowerCase() === searchQuery.toLowerCase() ? (
                            <mark key={i} className="bg-yellow-200 text-gray-900 rounded px-0.5">{part}</mark>
                          ) : part
                        )}
                      </span>
                    ) : (
                      sn.serialNumber
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(sn.addedAt).toLocaleDateString("ar-EG", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                      متاح في المخزن
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}