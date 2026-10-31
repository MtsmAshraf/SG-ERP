import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import { 
  Bell, CheckCheck, Trash2, Clock, CheckCircle, XCircle, 
  Calendar, DollarSign, ArrowUpCircle, ArrowDownCircle, 
  ShoppingCart, AlertCircle
} from "lucide-react"
import { markAsRead, markAllAsRead, deleteNotification } from "./actions"
import { getNotificationMeta } from "@/lib/notifications"

export const dynamic = "force-dynamic"

export default async function NotificationsPage() {
  const session = await auth()
  if (!session) return null
  
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { actor: { select: { name: true } } }
    }),
    prisma.notification.count({
      where: { userId: session.user.id, read: false }
    })
  ])
  
  const iconMap: Record<string, any> = {
    Clock, CheckCircle, XCircle, Calendar, DollarSign,
    ArrowUpCircle, ArrowDownCircle, ShoppingCart, Bell: AlertCircle
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#061228] flex items-center gap-2">
            <Bell size={28} className="text-[#dda322]" />
            الإشعارات
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {unreadCount > 0 
              ? `لديك ${unreadCount} إشعار${unreadCount > 10 ? "اً" : ""} غير مقروؤ${unreadCount === 1 ? "ة" : "ات"}`
              : "جميع الإشعارات مقروءة"}
          </p>
        </div>
        {unreadCount > 0 && (
          <form action={markAllAsRead}>
            <button 
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition shadow-sm"
            >
              <CheckCheck size={16} />
              تحديد الكل كمقروء
            </button>
          </form>
        )}
      </div>

      {/* Notifications List */}
      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500">لا توجد إشعارات بعد</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map((notification) => {
              const meta = getNotificationMeta(notification.type)
              const Icon = iconMap[meta.icon] || Bell
              
              return (
                <div 
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition ${!notification.read ? "bg-blue-50/30" : ""}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${meta.bgColor}`}>
                      <Icon size={20} className={meta.color} />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className={`text-sm ${!notification.read ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                            {notification.title}
                            {!notification.read && (
                              <span className="ml-2 inline-block h-2 w-2 rounded-full bg-blue-500"></span>
                            )}
                          </p>
                          <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              {notification.createdAt.toLocaleString("ar-EG", {
                                dateStyle: "short",
                                timeStyle: "short"
                              })}
                            </span>
                            {notification.actor && (
                              <span>بواسطة: {notification.actor.name}</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {notification.link && (
                            <Link 
                              href={notification.link}
                              className="rounded-lg p-2 text-[#061228] hover:bg-gray-100 transition"
                              title="عرض التفاصيل"
                            >
                              <Bell size={16} />
                            </Link>
                          )}
                          {!notification.read && (
                            <form action={markAsRead}>
                              <input type="hidden" name="notificationId" value={notification.id} />
                              <button 
                                type="submit"
                                className="rounded-lg p-2 text-green-600 hover:bg-green-50 transition"
                                title="تحديد كمقروء"
                              >
                                <CheckCircle size={16} />
                              </button>
                            </form>
                          )}
                          <form action={deleteNotification}>
                            <input type="hidden" name="notificationId" value={notification.id} />
                            <button 
                              type="submit"
                              className="rounded-lg p-2 text-red-600 hover:bg-red-50 transition"
                              title="حذف"
                            >
                              <Trash2 size={16} />
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}