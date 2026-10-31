import { prisma } from "@/lib/prisma"
import { requirePermission, getUserPermissions } from "@/lib/auth-utils"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Pencil, Users, Phone, Mail, MapPin, Briefcase, Building2, UserCircle, FileText, Printer, CheckCircle2 } from "lucide-react"
import { DeleteCustomerButton } from "../DeleteCustomerButton"
import { markInvoiceAsPaid } from "@/app/(dashboard)/invoices/actions"

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("canViewCustomers")
  const permissions = await getUserPermissions()
  const { id } = await params

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { 
      contacts: { orderBy: { createdAt: "asc" } },
      salesOrders: { orderBy: { createdAt: "desc" }, take: 5 },
      priceOffers: { orderBy: { createdAt: "desc" }, take: 5 },
      invoices: { orderBy: { createdAt: "desc" } },
      createdBy: { select: { id: true, name: true } } 

    }
  })

  if (!customer) notFound()

  const pct = customer.defaultPercentage.toNumber()

  // ✅ Calculate Total Due (Unpaid Invoices)
  const unpaidInvoices = customer.invoices.filter(inv => inv.status !== "PAID")
  const totalDue = unpaidInvoices.reduce((sum, inv) => sum + inv.total.toNumber(), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href="/customers" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#dda322] transition mb-2">
            <ArrowRight size={16} /> العودة إلى العملاء
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#dda322]/10">
              <Users className="text-[#dda322]" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#061228]">{customer.name}</h1>
              {customer.fieldOfWork && (
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Briefcase size={14} /> {customer.fieldOfWork}
                </p>
              )}
            </div>
          </div>
        </div>

        {(permissions?.canEditCustomers || permissions?.canDeleteCustomers) && (
          <div className="flex items-center gap-2">
            {permissions?.canEditCustomers && (
              <Link href={`/customers/${customer.id}/edit`} className="inline-flex items-center gap-2 rounded-lg bg-[#dda322] px-4 py-2 text-sm font-medium text-white hover:bg-[#b8861b] transition shadow-sm">
                <Pencil size={16} /> تعديل العميل
              </Link>
            )}
            {permissions?.canDeleteCustomers && <DeleteCustomerButton customerId={customer.id} customerName={customer.name} />}
          </div>
        )}
      </div>

      <div>
        {customer.createdBy && (
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            تمت الإضافة بواسطة: <span className="font-medium text-gray-700">{customer.createdBy.name}</span>
          </p>
        )}
        {customer.createdBy === null && (
          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
            تمت الإضافة بواسطة: <span className="font-medium text-gray-700">System</span>
          </p>
        )}
        {customer.fieldOfWork && (
          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
            <Briefcase size={14} /> {customer.fieldOfWork}
          </p>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Contact Info */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2">
            <Phone size={16} className="text-green-600" /> معلومات التواصل
          </h3>
          <div className="space-y-2">
            {customer.phone ? (
              <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-[#dda322] transition">
                <Phone size={16} className="text-green-600" />
                <span dir="ltr">{customer.phone}</span>
              </a>
            ) : (
              <p className="text-gray-400 italic">لا يوجد رقم هاتف</p>
            )}
            {customer.email && (
              <a href={`mailto:${customer.email}`} className="flex items-center gap-2 text-sm text-gray-700 hover:text-[#dda322] transition">
                <Mail size={14} /> {customer.email}
              </a>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2">
            <MapPin size={16} className="text-blue-600" /> الموقع
          </h3>
          {customer.area && (
            <p className="text-lg font-semibold text-[#061228] flex items-center gap-2">
              <Building2 size={18} className="text-blue-600" /> {customer.area}
            </p>
          )}
          {customer.address ? (
            <p className="mt-2 text-sm text-gray-600">{customer.address}</p>
          ) : !customer.area && (
            <p className="text-gray-400 italic">لا يوجد عنوان</p>
          )}
        </div>

        {/* Default Percentage */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-bold text-gray-500 mb-3">النسبة المئوية الافتراضية</h3>
          {pct === 0 ? (
            <p className="text-2xl font-bold text-gray-400">لا يوجد</p>
          ) : pct > 0 ? (
            <p className="text-2xl font-bold text-green-600">+{pct.toFixed(2)}% ربح</p>
          ) : (
            <p className="text-2xl font-bold text-red-600">{pct.toFixed(2)}% خصم</p>
          )}
        </div>

        {/* ✅ NEW: Total Due Card */}
        <div className={`rounded-lg border p-6 shadow-sm ${totalDue > 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
          <h3 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2">
            <FileText size={16} className={totalDue > 0 ? "text-red-600" : "text-green-600"} /> إجمالي المستحقات
          </h3>
          <p className={`text-2xl font-bold ${totalDue > 0 ? "text-red-700" : "text-green-700"}`}>
            {totalDue.toFixed(2)} EGP
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {unpaidInvoices.length} فاتورة غير مدفوعة
          </p>
        </div>
      </div>

      {/* Contacts Inside the Company */}
      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <div className="border-b bg-gray-50 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#061228] flex items-center gap-2">
            <UserCircle size={20} /> جهات الاتصال داخل الشركة
          </h2>
          <span className="text-sm text-gray-500">{customer.contacts.length} جهة اتصال</span>
        </div>

        {customer.contacts.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">لا توجد جهات اتصال مسجلة لهذا العميل.</div>
        ) : (
          <div className="overflow-x-auto force-ltr">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الاسم</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">المسمى الوظيفي</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">رقم الهاتف</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customer.contacts.map((contact: any) => (
                  <tr key={contact.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contact.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{contact.jobTitle || "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {contact.phone ? (
                        <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-1.5 text-gray-700 hover:text-[#dda322] transition font-medium">
                          <Phone size={14} className="text-green-600" />
                          <span dir="ltr">{contact.phone}</span>
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ✅ NEW: Invoices Section */}
      <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
        <div className="border-b bg-gray-50 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#061228] flex items-center gap-2">
            <FileText size={20} /> فواتير العميل
          </h2>
          <Link href={`/invoices?customerId=${customer.id}`} className="text-sm text-[#dda322] hover:text-[#b8861b] font-medium">
            عرض كل الفواتير ←
          </Link>
        </div>

        {customer.invoices.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">لا توجد فواتير لهذا العميل بعد.</div>
        ) : (
          <div className="overflow-x-auto force-ltr">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">رقم الفاتورة</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">المبلغ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customer.invoices.map((invoice: any) => {
                  const isPaid = invoice.status === "PAID"
                  return (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{invoice.invoiceNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.createdAt.toLocaleDateString('ar-EG')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{invoice.total.toNumber().toFixed(2)} EGP</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${isPaid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {isPaid ? "مدفوعة" : "غير مدفوعة"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          {/* Print Button */}
                          <Link href={`/invoices/${invoice.id}/print`} className="text-[#061228] hover:text-[#dda322] p-1 rounded hover:bg-gray-100 transition" title="طباعة">
                            <Printer size={18} />
                          </Link>
                          
                          {/* Pay Button */}
                          {!isPaid && (
                            <form action={markInvoiceAsPaid}>
                              <input type="hidden" name="invoiceId" value={invoice.id} />
                              <button type="submit" className="inline-flex items-center gap-1 text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 transition" title="تسجيل الدفع">
                                <CheckCircle2 size={18} />
                              </button>
                            </form>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Orders & Offers (Existing Section) */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Sales Orders */}
        <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
          <div className="border-b bg-gray-50 px-6 py-4">
            <h2 className="text-lg font-bold text-[#061228]">آخر أوامر البيع</h2>
          </div>
          {customer.salesOrders.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">لا توجد أوامر بيع.</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {customer.salesOrders.map((order: any) => (
                <Link key={order.id} href={`/sales-orders/${order.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">{order.createdAt.toLocaleDateString('ar-EG')}</p>
                  </div>
                  <span className="text-sm font-bold text-[#dda322]">{order.total.toNumber().toFixed(2)} EGP</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Price Offers */}
        <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
          <div className="border-b bg-gray-50 px-6 py-4">
            <h2 className="text-lg font-bold text-[#061228]">آخر عروض الأسعار</h2>
          </div>
          {customer.priceOffers.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">لا توجد عروض أسعار.</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {customer.priceOffers.map((offer: any) => (
                <Link key={offer.id} href={`/price-offers/${offer.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{offer.offerNumber}</p>
                    <p className="text-xs text-gray-500">{offer.createdAt.toLocaleDateString('ar-EG')}</p>
                  </div>
                  <span className="text-sm font-bold text-[#dda322]">{offer.total.toNumber().toFixed(2)} EGP</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}