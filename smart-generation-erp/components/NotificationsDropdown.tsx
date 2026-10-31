"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { 
  Bell, Clock, CheckCircle, XCircle, Calendar, DollarSign, 
  ArrowUpCircle, ArrowDownCircle, ShoppingCart, AlertCircle,
  CheckCheck
} from "lucide-react"
import { markAllAsRead } from "@/app/(dashboard)/notifications/actions"
import { useNotifications } from "@/hooks/useNotifications"

const iconMap: Record<string, any> = {
  Clock, CheckCircle, XCircle, Calendar, DollarSign,
  ArrowUpCircle, ArrowDownCircle, ShoppingCart, Bell: AlertCircle
}

const colorMap: Record<string, { color: string; bgColor: string }> = {
  PRICE_OFFER_SUBMITTED: { color: "text-yellow-600", bgColor: "bg-yellow-100" },
  PRICE_OFFER_APPROVED: { color: "text-green-600", bgColor: "bg-green-100" },
  PRICE_OFFER_REJECTED: { color: "text-red-600", bgColor: "bg-red-100" },
  PURCHASE_ORDER_SUBMITTED: { color: "text-yellow-600", bgColor: "bg-yellow-100" },
  PURCHASE_ORDER_APPROVED: { color: "text-green-600", bgColor: "bg-green-100" },
  PURCHASE_ORDER_REJECTED: { color: "text-red-600", bgColor: "bg-red-100" },
  INVOICE_PAID: { color: "text-green-600", bgColor: "bg-green-100" },
  LEAVE_REQUESTED: { color: "text-blue-600", bgColor: "bg-blue-100" },
  LEAVE_APPROVED: { color: "text-green-600", bgColor: "bg-green-100" },
  LEAVE_REJECTED: { color: "text-red-600", bgColor: "bg-red-100" },
  DEPOSIT_OUT: { color: "text-purple-600", bgColor: "bg-purple-100" },
  DEPOSIT_RETURNED: { color: "text-green-600", bgColor: "bg-green-100" },
  DEPOSIT_SOLD: { color: "text-orange-600", bgColor: "bg-orange-100" },
  CUSTODY_OUT: { color: "text-purple-600", bgColor: "bg-purple-100" },
  CUSTODY_RETURNED: { color: "text-green-600", bgColor: "bg-green-100" },
  CUSTODY_SOLD: { color: "text-orange-600", bgColor: "bg-orange-100" },
  MAINTENANCE_CREATED: { color: "text-red-600", bgColor: "bg-red-100" },
  MAINTENANCE_UPDATED: { color: "text-yellow-600", bgColor: "bg-yellow-100" },
  MAINTENANCE_COMPLETED: { color: "text-green-600", bgColor: "bg-green-100" },
  MAINTENANCE_RETURNED: { color: "text-blue-600", bgColor: "bg-blue-100" },
  SYSTEM: { color: "text-gray-600", bgColor: "bg-gray-100" },
}

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // ✅ Use the global hook instead of local state
  const { notifications, unreadCount, refetch } = useNotifications()
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])
  
  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
    refetch() // Refresh after marking as read
  }
  
  const getIcon = (type: string) => {
    const colors = colorMap[type] || colorMap.SYSTEM
    const Icon = iconMap[type] || Bell
    return { Icon, ...colors }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 text-gray-600 hover:bg-gray-100 transition"
        title="الإشعارات"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      
      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-96 rounded-lg border bg-white shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
            <h3 className="font-bold text-[#061228]">الإشعارات</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
              >
                <CheckCheck size={14} />
                تحديد الكل كمقروء
              </button>
            )}
          </div>
          
          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="mx-auto text-gray-300 mb-2" size={32} />
                <p className="text-sm text-gray-500">لا توجد إشعارات</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => {
                  const { Icon, color, bgColor } = getIcon(notification.type)
                  
                  return (
                    <Link
                      key={notification.id}
                      href={notification.link || "/notifications"}
                      onClick={() => setIsOpen(false)}
                      className={`block p-3 hover:bg-gray-50 transition ${!notification.read ? "bg-blue-50/30" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${bgColor}`}>
                          <Icon size={16} className={color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!notification.read ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                            {notification.title}
                            {!notification.read && (
                              <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                            )}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-600 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {new Date(notification.createdAt).toLocaleString("ar-EG", {
                              dateStyle: "short",
                              timeStyle: "short"
                            })}
                          </p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="border-t bg-gray-50 px-4 py-2">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="block text-center text-sm font-medium text-[#dda322] hover:text-[#b8861b] transition"
            >
              عرض جميع الإشعارات ←
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}