import { prisma } from "@/lib/prisma"
import { requireRole, requirePermission } from "@/lib/auth-utils"
import Link from "next/link"
import { ShieldCheck } from "lucide-react"
import { UserActionButton } from "./DeleteUserButton" // Renamed import to match new component name

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ showInactive?: string }> }) {
  await requirePermission("canViewUsers")
  
  const params = await searchParams
  const showInactive = params.showInactive === "true"

  const users = await prisma.user.findMany({
    where: { isActive: !showInactive }, // Fetch active by default, inactive if toggled
    orderBy: { createdAt: "desc" }
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#061228]">إدارة المستخدمين</h1>
          <p className="mt-1 text-sm text-gray-500">
            {showInactive ? "عرض المستخدمين المعطلين" : "إدارة صلاحيات وبيانات موظفي النظام."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href={showInactive ? "/users" : "/users?showInactive=true"} 
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
          >
            {showInactive ? "إخفاء المعطلين" : "عرض المستخدمين المعطلين"}
          </Link>
          
          {!showInactive && (
            <Link 
              href="/users/new" 
              className="inline-flex justify-center items-center px-4 py-2 bg-[#dda322] text-white rounded-lg hover:bg-[#b8861b] transition font-medium shadow-sm"
            >
              + إضافة مستخدم جديد
            </Link>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto force-ltr">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الاسم</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">البريد الإلكتروني</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الدور</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className={`hover:bg-gray-50 transition ${!user.isActive ? "bg-gray-50/50" : ""}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === "ADMIN" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {user.role === "ADMIN" ? "مدير" : "موظف"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {user.isActive ? "نشط" : "معطل"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-3">
                      {user.isActive && (
                        <Link 
                          href={`/users/${user.id}/permissions`} 
                          className="text-[#dda322] hover:text-[#b8861b] p-1 rounded hover:bg-[#dda322]/10 transition"
                          title="إدارة الصلاحيات"
                        >
                          <ShieldCheck size={18} />
                        </Link>
                      )}
                      {/* Pass isActive status to the unified button */}
                      <UserActionButton userId={user.id} userName={user.name} isActive={user.isActive} />
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                    {showInactive ? "لا يوجد مستخدمون معطلون حالياً." : "لا يوجد مستخدمون نشطون حالياً."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}