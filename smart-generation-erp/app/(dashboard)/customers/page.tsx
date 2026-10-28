import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { requirePermission, getUserPermissions } from "@/lib/auth-utils"
import { Pagination } from "@/components/Pagination"
import { PAGE_SIZE } from "@/lib/pagination"
import Link from "next/link"
import { Search, Eye, Pencil, Trash2, Users, Phone, MapPin, Briefcase } from "lucide-react"
import { DeleteCustomerButton } from "./DeleteCustomerButton"

export default async function CustomersPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
}) {
  await requirePermission("canViewCustomers")
  const permissions = await getUserPermissions()

  const params = await searchParams
  const currentPage = Number(params.page) || 1
  const searchQuery = (params.search as string) || ""

  const where: Prisma.CustomerWhereInput = searchQuery ? {
    OR: [
      { name: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } },
      { email: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } },
      { phone: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } },
      { area: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } },
      { fieldOfWork: { contains: searchQuery, mode: Prisma.QueryMode.insensitive } },
    ]
  } : {}

  const [customers, totalItems] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { contacts: true }
    }),
    prisma.customer.count({ where })
  ])

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#061228]">العملاء</h1>
          <p className="mt-1 text-sm text-gray-500">إدارة قاعدة بيانات العملاء وجهات الاتصال.</p>
        </div>
        {permissions?.canCreateCustomers && (
          <Link href="/customers/new" className="inline-flex justify-center items-center px-4 py-2 bg-[#dda322] text-white rounded-lg hover:bg-[#b8861b] transition font-medium shadow-sm">
            + إضافة عميل جديد
          </Link>
        )}
      </div>

      {/* Search */}
      <form className="mb-4 relative max-w-md">
        <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          name="search"
          defaultValue={searchQuery}
          placeholder="ابحث بالاسم، البريد، الهاتف، المنطقة، أو مجال العمل..."
          className="w-full rounded-lg border border-gray-300 py-2 pr-10 pl-3 text-sm focus:border-[#dda322] focus:outline-none focus:ring-1 focus:ring-[#dda322]"
        />
        <button type="submit" className="sr-only">بحث</button>
      </form>

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <div className="overflow-x-auto force-ltr">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">العميل</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">التواصل</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الموقع / المجال</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">النسبة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">لا توجد نتائج مطابقة.</td></tr>
              ) : (
                customers.map((customer) => {
                  const pct = customer.defaultPercentage.toNumber()
                  return (
                    <tr key={customer.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#dda322]/10">
                            <Users className="text-[#dda322]" size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{customer.name}</p>
                            {customer.email && <p className="text-xs text-gray-500">{customer.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="space-y-1">
                          {customer.phone && (
                            <a href={`tel:${customer.phone}`} className="inline-flex items-center gap-1.5 text-gray-700 hover:text-[#dda322] transition">
                              <Phone size={14} className="text-green-600" />
                              <span dir="ltr">{customer.phone}</span>
                            </a>
                          )}
                          {customer.contacts.length > 0 && (
                            <div className="mt-1 pt-1 border-t border-gray-100">
                              <p className="text-xs text-gray-500 mb-1">جهات الاتصال ({customer.contacts.length}):</p>
                              {customer.contacts.slice(0, 2).map((contact) => (
                                <div key={contact.id} className="flex items-center gap-1.5 text-xs">
                                  {contact.phone ? (
                                    <a href={`tel:${contact.phone}`} className="text-gray-600 hover:text-[#dda322] transition" dir="ltr">
                                      {contact.name}: {contact.phone}
                                    </a>
                                  ) : (
                                    <span className="text-gray-600">{contact.name}</span>
                                  )}
                                  {contact.jobTitle && <span className="text-gray-400">({contact.jobTitle})</span>}
                                </div>
                              ))}
                              {customer.contacts.length > 2 && (
                                <p className="text-xs text-gray-400 mt-1">+ {customer.contacts.length - 2} آخرين</p>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="space-y-1">
                          {customer.area && (
                            <div className="flex items-center gap-1.5 text-gray-700">
                              <MapPin size={14} className="text-blue-600" />
                              <span>{customer.area}</span>
                            </div>
                          )}
                          {customer.fieldOfWork && (
                            <div className="flex items-center gap-1.5 text-gray-700">
                              <Briefcase size={14} className="text-purple-600" />
                              <span>{customer.fieldOfWork}</span>
                            </div>
                          )}
                          {!customer.area && !customer.fieldOfWork && <span className="text-gray-400">—</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {pct === 0 ? (
                          <span className="text-gray-400">—</span>
                        ) : pct > 0 ? (
                          <span className="text-green-600 font-medium">+{pct.toFixed(2)}%</span>
                        ) : (
                          <span className="text-red-600 font-medium">{pct.toFixed(2)}%</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/customers/${customer.id}`} className="text-[#061228] hover:text-[#dda322] p-1 rounded hover:bg-gray-100 transition" title="عرض التفاصيل">
                            <Eye size={18} />
                          </Link>
                          {permissions?.canEditCustomers && (
                            <Link href={`/customers/${customer.id}/edit`} className="text-[#dda322] hover:text-[#b8861b] p-1 rounded hover:bg-[#dda322]/10 transition" title="تعديل">
                              <Pencil size={18} />
                            </Link>
                          )}
                          {permissions?.canDeleteCustomers && <DeleteCustomerButton customerId={customer.id} customerName={customer.name} />}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination totalItems={totalItems} currentPage={currentPage} baseUrl="/customers" searchQuery={searchQuery} />
    </div>
  )
}