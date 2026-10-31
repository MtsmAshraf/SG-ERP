"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { 
  LayoutDashboard, Package, Users, FileText, UserCog, 
  LogOut, Truck, ShoppingCart, Menu, X, 
  Briefcase, Settings,
  BarChart3,
  ScrollText,
  HandCoins,
  UserCheck,
  FileTextIcon,
  WarehouseIcon,
  Bell,
  Wrench
} from "lucide-react"
import Link from "next/link"
import { TopHeader } from "../components/TopHeader"
import { NotificationsDropdown } from "@/components/NotificationsDropdown" // ✅ Added import

interface DashboardClientLayoutProps {
  userName: string
  permissions: any
  companyData?: {
    name: string
    logo: string | null
    currency: string
  }
  children: React.ReactNode
}

export default function DashboardClientLayout({ 
  userName, 
  permissions, 
  companyData = { name: "Smart Generation ERP", logo: null, currency: "$" }, 
  children 
}: DashboardClientLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "لوحة التحكم", perm: permissions?.canViewDashboard },
    { href: "/notifications", icon: Bell, label: "الإشعارات", perm: true }, // ✅ Notifications in sidebar
    { href: "/reports", icon: BarChart3, label: "تحليل البيانات", perm: permissions?.canViewReports },
    { href: "/products", icon: Package, label: "المنتجات", perm: permissions?.canViewProducts },
    { href: "/customers", icon: Users, label: "العملاء", perm: permissions?.canViewCustomers },
    { href: "/suppliers", icon: Truck, label: "الموردين", perm: permissions?.canViewSuppliers },
    { href: "/purchase-orders", icon: ShoppingCart, label: "أوامر الشراء", perm: permissions?.canViewPurchaseOrders },
    { href: "/purchase-orders/items", icon: Package, label: "جميع بنود المشتريات", perm: permissions?.canViewPurchaseOrders },
    { href: "/price-offers", icon: FileText, label: "عروض الأسعار", perm: permissions?.canViewPriceOffers },
    { href: "/sales-orders", icon: FileText, label: "أوامر البيع", perm: permissions?.canViewSalesOrders },
    { href: "/deposits", icon: HandCoins, label: "الأمانات", perm: permissions?.canViewDeposits },
    { href: "/custodies", icon: UserCheck, label: "العهد", perm: permissions?.canViewCustodies },
    { href: "/maintenance", icon: Wrench, label: "الصيانة", perm: permissions?.canViewMaintenance },
    { href: "/warehouse", icon: WarehouseIcon, label: "المخزن", perm: permissions?.canViewWarehouse },
    { href: "/invoices", icon: FileTextIcon, label: "الفواتير", perm: true },
    { href: "/hr", icon: Briefcase, label: "الموارد البشرية", perm: permissions?.canViewHR },
    { href: "/users", icon: UserCog, label: "إدارة المستخدمين", perm: permissions?.canViewUsers },
    { href: "/activity-log", icon: ScrollText, label: "سجل النشاط", perm: permissions?.canViewActivityLog },
    { href: "/settings", icon: Settings, label: "الإعدادات", perm: permissions?.canManageSettings },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50" dir="rtl">
      {/* Mobile Header */}
      <div className="fixed top-0 right-0 left-0 z-40 flex h-16 items-center justify-between border-b bg-white px-4 md:hidden">
        <span className="text-lg font-bold text-[#061228] truncate">{companyData.name}</span>
        <div className="flex items-center gap-1">
          {/* ✅ Notifications Dropdown for Mobile */}
          <NotificationsDropdown />
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded p-2 text-gray-600 hover:bg-gray-100"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 right-0 z-50 w-64 transform bg-[#061228] text-gray-300 transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
        isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
      }`}>
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4 md:justify-center md:px-6">
          {companyData.logo ? (
            <img 
              src={companyData.logo} 
              alt="Company Logo" 
              className="h-9 w-9 object-contain rounded bg-white p-0.5 flex-shrink-0" 
            />
          ) : (
            <div className="h-9 w-9 rounded bg-[#dda322] flex items-center justify-center text-[#061228] font-bold text-lg flex-shrink-0">
              SG
            </div>
          )}
          <span className="text-lg font-bold text-white truncate mx-3">
            {companyData.name}
          </span>
          <button className="md:hidden text-gray-400 hover:text-white flex-shrink-0" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="mt-6 flex-1 space-y-1 overflow-y-auto px-3 pb-24">
          {navItems.map((item) => {
            if (!item.perm) return null
            const isActive = item.href === "/dashboard" 
              ? pathname === "/dashboard" 
              : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-[#dda322]/15 text-[#dda322] border-r-2 border-[#dda322]"
                    : "text-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <item.icon size={20} className={isActive ? "text-[#dda322]" : "text-gray-400"} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 right-0 left-0 border-t border-white/10 bg-[#061228] px-6 py-4 text-center">
          <p className="text-xs text-gray-400">© {new Date().getFullYear()} {companyData.name}</p>
          <p className="mt-1 text-xs text-gray-400">
            بواسطة:{" "}
            <a href="https://moatasimashraf.com/" target="_blank" rel="noopener noreferrer" className="font-medium text-[#dda322] hover:text-[#eec144] transition-colors">
              معتصم أشرف
            </a>
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col pt-16 md:pt-0 min-w-0">
        {/* Desktop Header */}
        <header className="hidden h-16 items-center justify-between border-b bg-white px-6 md:flex">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-[#061228]">مرحباً، {userName}</h2>
            <span className="text-sm text-gray-400">|</span>
            <span className="text-sm font-medium text-[#dda322]">العملة: {companyData.currency}</span>
          </div>
          
          {/* ✅ Notifications + Sign Out grouped together */}
          <div className="flex items-center gap-3">
            <NotificationsDropdown />
            <form action={async () => { await signOut({ redirectTo: "/login" }) }}>
              <button className="flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-red-50 hover:text-red-600">
                <LogOut size={16} />
                تسجيل الخروج
              </button>
            </form>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          <TopHeader />
          {children}
        </main>
      </div>
    </div>
  )
}