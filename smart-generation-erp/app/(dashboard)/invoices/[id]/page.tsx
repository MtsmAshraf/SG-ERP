import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Printer } from "lucide-react"
import { getCurrencySymbol } from "@/lib/settings"
import { PrintButton } from "../PrintButton"

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("canViewSalesOrders")
  const { id } = await params
  const currency = await getCurrencySymbol()

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { 
      customer: true, 
      salesOrder: { include: { items: { include: { product: true } } } },
    }
  })

  if (!invoice) notFound()

  const settings = await prisma.companySettings.findUnique({ where: { id: "global_settings" } })

  return (
    <div className="space-y-6">
      {/* Action Bar (Hidden when printing) */}
      <div className="flex items-center justify-between print-hidden">
        <Link href="/invoices" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#dda322] transition">
          <ArrowRight size={16} /> العودة إلى الفواتير
        </Link>
        <PrintButton />
      </div>

      {/* Invoice Paper (Styled for Screen and Print) */}
      <div className="bg-white p-8 md:p-12 shadow-sm border rounded-lg print:shadow-none print:border-none print:p-0 print-container mx-auto">
        
        {/* Invoice Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b pb-6 border-gray-200">
          <div>
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="h-16 w-auto object-contain mb-4" />
            ) : (
              <h1 className="text-3xl font-bold text-[#061228] mb-2">{settings?.companyName || "Smart Generation ERP"}</h1>
            )}
            <div className="text-sm text-gray-600 space-y-1">
              {settings?.address && <p>{settings.address}</p>}
              {settings?.phone && <p>هاتف: {settings.phone}</p>}
              {settings?.email && <p>بريد: {settings.email}</p>}
            </div>
          </div>
          <div className="mt-6 md:mt-0 text-left md:text-right">
            <h2 className="text-4xl font-bold text-[#dda322] mb-2">فاتورة</h2>
            <p className="text-lg font-semibold text-gray-900">#{invoice.invoiceNumber}</p>
            <p className="text-sm text-gray-500 mt-1">تاريخ الإصدار: {invoice.issueDate.toLocaleDateString('ar-EG')}</p>
            <p className="text-sm text-gray-500">تاريخ الاستحقاق: {invoice.dueDate?.toLocaleDateString('ar-EG') || "غير محدد"}</p>
            <span className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-bold ${invoice.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {invoice.status === 'PAID' ? 'مدفوعة' : 'غير مدفوعة'}
            </span>
          </div>
        </div>

        {/* Bill To */}
        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">فاتورة إلى:</h3>
          <p className="text-xl font-bold text-[#061228]">{invoice.customer.name}</p>
          {invoice.customer.address && <p className="text-gray-600">{invoice.customer.address}</p>}
          {invoice.customer.phone && <p className="text-gray-600">{invoice.customer.phone}</p>}
        </div>

        {/* Items Table (Force LTR for numbers) */}
        <div className="overflow-x-auto force-ltr mb-8">
          <table className="min-w-full divide-y divide-gray-200 border">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">المنتج</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">الكمية</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">سعر الوحدة</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoice.salesOrder.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{item.product.name}</td>
                  <td className="px-4 py-4 text-sm text-gray-600 text-center">{item.quantity}</td>
                  <td className="px-4 py-4 text-sm text-gray-600 text-right">{currency} {item.unitPrice.toNumber().toFixed(2)}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-gray-900 text-right">{currency} {item.lineTotal.toNumber().toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-full md:w-1/2 space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>المجموع الفرعي:</span>
              <span className="font-medium">{currency} {invoice.subtotal.toNumber().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>الضريبة ({invoice.taxRate.toNumber()}%):</span>
              <span className="font-medium">{currency} {invoice.taxAmount.toNumber().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-[#061228] border-t pt-3 border-gray-200">
              <span>الإجمالي النهائي:</span>
              <span>{currency} {invoice.total.toNumber().toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer / Notes */}
        <div className="border-t pt-6 text-center text-sm text-gray-500">
          <p>شكراً لتعاملكم معنا.</p>
          <p className="mt-1 text-xs">تم إنشاء هذه الفاتورة إلكترونياً عبر نظام Smart Generation ERP</p>
        </div>
      </div>

    </div>
  )
}