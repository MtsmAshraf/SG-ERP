"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Home, ArrowRight } from "lucide-react"

// Dictionary for Arabic labels
const labels: Record<string, string> = {
  dashboard: "لوحة التحكم",
  products: "المنتجات",
  customers: "العملاء",
  suppliers: "الموردين",
  "purchase-orders": "أوامر الشراء",
  "price-offers": "عروض الأسعار",
  "sales-orders": "أوامر البيع",
  users: "المستخدمين",
  hr: "الموارد البشرية",
  departments: "الأقسام",
  employees: "الموظفين",
  leaves: "الإجازات",
  payroll: "الرواتب",
  new: "إضافة جديد",
  edit: "تعديل",
  permissions: "الصلاحيات",
  generate: "إنشاء",
}

export function TopHeader() {
  const pathname = usePathname()
  const router = useRouter()
  
  // Split path and filter out empty strings
  const paths = pathname.split("/").filter(Boolean)

  return (
    <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-3 sm:pb-4 bg-white p-3 sm:p-4 rounded-lg shadow-sm">
      
      {/* Breadcrumbs */}
      {/* FIX: Replaced overflow-x-auto with flex-wrap so it wraps naturally on mobile */}
      <nav className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard" className="flex items-center gap-1 hover:text-[#dda322] transition">
          <Home size={16} />
          <span>الرئيسية</span>
        </Link>
        
        {paths.map((path, index) => {
          // Skip dynamic IDs (like CUIDs) to keep breadcrumbs clean
          if (path.length > 20) return null; 
          
          const isLast = index === paths.length - 1
          const href = "/" + paths.slice(0, index + 1).join("/")
          const label = labels[path] || path

          return (
            <div key={path} className="flex items-center gap-2">
              <ArrowRight size={14} className="text-gray-300" />
              {isLast ? (
                <span className="font-bold text-[#061228]">{label}</span>
              ) : (
                <Link href={href} className="hover:text-[#dda322] transition">
                  {label}
                </Link>
              )}
            </div>
          )
        })}
      </nav>

      {/* Back Button */}
      {/* FIX: w-full on mobile, w-auto on desktop for better touch targets */}
      <button 
        onClick={() => router.back()} 
        className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-[#dda322] hover:text-[#dda322] transition shadow-sm w-full sm:w-auto"
      >
        <ArrowRight size={16} /> رجوع
      </button>
    </div>
  )
}