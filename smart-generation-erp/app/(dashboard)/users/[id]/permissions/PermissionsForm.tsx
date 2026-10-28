"use client"

import { useActionState, useEffect, useState } from "react"
import { updateUserPermissions } from "../../actions"
import { PermissionToggle } from "../../PermissionToggle"
import Link from "next/link"
import { CheckCircle2, XCircle, X } from "lucide-react"

interface Permissions {
  [key: string]: boolean
}

interface PermissionsFormProps {
  userId: string
  userName: string
  userRole: string
  userEmail: string
  permissions: Permissions
}

export function PermissionsForm({ userId, userName, userRole, userEmail, permissions }: PermissionsFormProps) {
  const [state, formAction, isPending] = useActionState(updateUserPermissions, null)
  const [showToast, setShowToast] = useState(false)
  const [toastType, setToastType] = useState<"success" | "error">("success")
  const [toastMessage, setToastMessage] = useState("")

  useEffect(() => {
    if (state) {
      if (state.success) {
        setToastType("success")
        setToastMessage(state.message || "تم حفظ الصلاحيات بنجاح!")
      } else {
        setToastType("error")
        setToastMessage(state.error || "فشل حفظ الصلاحيات. يرجى المحاولة مرة أخرى.")
      }
      setShowToast(true)
      
      const timer = setTimeout(() => setShowToast(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [state])

  return (
    <>
      {/* Floating Toast Notification */}
      {showToast && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 rounded-xl border px-5 py-4 shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-top-5 ${
          toastType === "success" 
            ? "border-green-200 bg-white text-green-800" 
            : "border-red-200 bg-white text-red-800"
        }`}>
          {toastType === "success" ? (
            <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
          ) : (
            <XCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
          )}
          <div className="flex-1">
            <p className="text-sm font-bold">
              {toastType === "success" ? "تمت العملية بنجاح" : "حدث خطأ"}
            </p>
            <p className="text-xs mt-0.5 opacity-90">{toastMessage}</p>
          </div>
          <button onClick={() => setShowToast(false)} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
      )}

      <div className="relative">
        <form action={formAction} className="space-y-8">
          <input type="hidden" name="userId" value={userId} />

          {/* Page Access */}
          <section className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[#061228]">الوصول إلى الصفحات</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <PermissionToggle name="canViewDashboard" label="لوحة التحكم" description="عرض لوحة التحكم الرئيسية" defaultChecked={permissions.canViewDashboard ?? true} />
              <PermissionToggle name="canViewProducts" label="المنتجات" description="عرض قائمة المنتجات والتفاصيل" defaultChecked={permissions.canViewProducts ?? true} />
              <PermissionToggle name="canViewCustomers" label="العملاء" description="عرض قائمة العملاء والتفاصيل" defaultChecked={permissions.canViewCustomers ?? true} />
              <PermissionToggle name="canViewSuppliers" label="الموردين" description="عرض قائمة الموردين والتفاصيل" defaultChecked={permissions.canViewSuppliers ?? true} />
              <PermissionToggle name="canViewPurchaseOrders" label="أوامر الشراء" description="عرض قائمة أوامر الشراء" defaultChecked={permissions.canViewPurchaseOrders ?? true} />
              <PermissionToggle name="canViewPriceOffers" label="عروض الأسعار" description="عرض قائمة عروض الأسعار" defaultChecked={permissions.canViewPriceOffers ?? true} />
              <PermissionToggle name="canViewSalesOrders" label="أوامر البيع" description="عرض قائمة أوامر البيع" defaultChecked={permissions.canViewSalesOrders ?? true} />
              <PermissionToggle name="canViewUsers" label="إدارة المستخدمين" description="عرض وإدارة المستخدمين الآخرين" defaultChecked={permissions.canViewUsers ?? false} />
              <PermissionToggle name="canViewHR" label="الموارد البشرية" description="الوصول إلى صفحة الموارد البشرية" defaultChecked={permissions.canViewHR ?? true} />
            </div>
          </section>

          {/* Product Actions */}
          <section className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[#061228]">إجراءات المنتجات</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <PermissionToggle name="canCreateProducts" label="إنشاء منتجات" description="إضافة منتجات جديدة للكتالوج" defaultChecked={permissions.canCreateProducts ?? false} />
              <PermissionToggle name="canEditProducts" label="تعديل منتجات" description="تعديل تفاصيل المنتجات" defaultChecked={permissions.canEditProducts ?? false} />
              <PermissionToggle name="canDeleteProducts" label="حذف منتجات" description="حذف منتجات من الكتالوج" defaultChecked={permissions.canDeleteProducts ?? false} />
              <PermissionToggle name="canAdjustStock" label="تعديل المخزون" description="تعديل مستويات المخزون يدوياً" defaultChecked={permissions.canAdjustStock ?? false} />
            </div>
          </section>

              {/* ✅ New Section for USD Rate Management */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-bold text-[#061228] mb-3">الإعدادات المالية</h3>
                <PermissionToggle 
                  name="canManageUsdRate" 
                  label="إدارة سعر الصرف" 
                  description="تحديث سعر الدولار في صفحة المنتجات" 
                  defaultChecked={permissions.canManageUsdRate ?? false} 
                />
              </div>

          {/* Customer & Supplier Actions */}
          <section className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[#061228]">إجراءات العملاء والموردين</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <PermissionToggle name="canCreateCustomers" label="إنشاء عملاء" description="إضافة عملاء جدد" defaultChecked={permissions.canCreateCustomers ?? true} />
              <PermissionToggle name="canEditCustomers" label="تعديل عملاء" description="تعديل بيانات العملاء" defaultChecked={permissions.canEditCustomers ?? true} />
              <PermissionToggle name="canCreateSuppliers" label="إنشاء موردين" description="إضافة موردين جدد" defaultChecked={permissions.canCreateSuppliers ?? false} />
              <PermissionToggle name="canEditSuppliers" label="تعديل موردين" description="تعديل بيانات الموردين" defaultChecked={permissions.canEditSuppliers ?? false} />
              <PermissionToggle name="canDeleteCustomers" label="حذف عملاء" description="حذف بيانات العملاء" defaultChecked={permissions.canDeleteCustomers ?? false} />
            </div>
          </section>

          {/* Purchase Order Actions */}
          <section className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[#061228]">إجراءات أوامر الشراء</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <PermissionToggle name="canCreatePurchaseOrders" label="إنشاء أوامر شراء" description="إنشاء أوامر شراء جديدة" defaultChecked={permissions.canCreatePurchaseOrders ?? false} />
              <PermissionToggle name="canApprovePurchaseOrders" label="اعتماد أوامر شراء" description="اعتماد أو رفض أوامر الشراء المعلقة" defaultChecked={permissions.canApprovePurchaseOrders ?? false} />
              <PermissionToggle name="canConfirmPurchaseOrders" label="تأكيد أوامر شراء" description="استلام المخزون من أوامر الشراء المعتمدة" defaultChecked={permissions.canConfirmPurchaseOrders ?? false} />
            </div>
          </section>

          {/* Price Offer Actions */}
          <section className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[#061228]">إجراءات عروض الأسعار</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <PermissionToggle name="canCreatePriceOffers" label="إنشاء عروض أسعار" description="إنشاء عروض أسعار جديدة" defaultChecked={permissions.canCreatePriceOffers ?? true} />
              <PermissionToggle name="canApprovePriceOffers" label="اعتماد عروض أسعار" description="اعتماد أو رفض العروض المعلقة" defaultChecked={permissions.canApprovePriceOffers ?? false} />
              <PermissionToggle name="canConvertPriceOffers" label="تحويل لأوامر بيع" description="تحويل العروض المعتمدة إلى أوامر بيع" defaultChecked={permissions.canConvertPriceOffers ?? true} />
            </div>
          </section>

          {/* Sales Order Actions */}
          <section className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[#061228]">إجراءات أوامر البيع</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <PermissionToggle name="canCreateSalesOrders" label="إنشاء أوامر بيع" description="إنشاء أوامر بيع مباشرة" defaultChecked={permissions.canCreateSalesOrders ?? false} />
              <PermissionToggle name="canConfirmSalesOrders" label="تأكيد أوامر بيع" description="تأكيد الطلبات وخصم المخزون" defaultChecked={permissions.canConfirmSalesOrders ?? true} />
            </div>
          </section>

          {/* User Management Actions */}
          <section className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[#061228]">إدارة المستخدمين</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <PermissionToggle name="canCreateUsers" label="إنشاء مستخدمين" description="إضافة مستخدمين جدد للنظام" defaultChecked={permissions.canCreateUsers ?? false} />
              <PermissionToggle name="canDeleteUsers" label="حذف مستخدمين" description="حذف مستخدمين من النظام" defaultChecked={permissions.canDeleteUsers ?? false} />
            </div>
          </section>

          {/* Export Actions */}
          <section className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[#061228]">إجراءات التصدير</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <PermissionToggle name="canExportData" label="تصدير البيانات" description="تصدير أوامر البيع إلى CSV" defaultChecked={permissions.canExportData ?? true} />
            </div>
          </section>

          {/* HR Actions */}
          <section className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[#061228]">الموارد البشرية</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <PermissionToggle name="canViewHR" label="عرض الموارد البشرية" description="الوصول إلى صفحة الموارد البشرية" defaultChecked={permissions.canViewHR ?? true} />
              <PermissionToggle name="canManageEmployees" label="إدارة الموظفين" description="إضافة وتعديل بيانات الموظفين والأقسام" defaultChecked={permissions.canManageEmployees ?? false} />
              <PermissionToggle name="canManageLeaves" label="إدارة الإجازات" description="اعتماد أو رفض طلبات الإجازة" defaultChecked={permissions.canManageLeaves ?? false} />
              <PermissionToggle name="canManagePayroll" label="إدارة الرواتب" description="عرض وإنشاء كشوف الرواتب الشهرية" defaultChecked={permissions.canManagePayroll ?? false} />
            </div>
          </section>

         <section className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[#061228]">إعدادات النظام</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <PermissionToggle 
                name="canManageSettings" 
                label="إدارة الإعدادات" 
                description="تعديل بيانات الشركة والشعار والضرائب" 
                defaultChecked={permissions.canManageSettings ?? false} 
              />
            </div>
          </section>

          
         <section className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[#061228]">عرض التقارير</h2>
            <div className="grid gap-3 sm:grid-cols-2">
             <PermissionToggle name="canViewReports" label="عرض التقارير" description="الوصول إلى صفحة التحليلات والتقارير" defaultChecked={permissions.canViewReports ?? false} />
            </div>
          </section>

         <section className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[#061228]">عرض التقارير</h2>
            <div className="grid gap-3 sm:grid-cols-2">
            <PermissionToggle 
              name="canViewActivityLog" 
              label="عرض سجل النشاط" 
              description="الوصول إلى صفحة سجل النشاط والتدقيق" 
              defaultChecked={permissions.canViewActivityLog ?? false} 
            />
            </div>
          </section>

        
          <section className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[#061228]">بيانات الأمانة</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <PermissionToggle name="canViewDeposits" label="عرض الأمانات" description="عرض سجلات الأمانات" defaultChecked={permissions.canViewDeposits ?? false} />
              <PermissionToggle name="canManageDeposits" label="إدارة الأمانات" description="إنشاء، بيع، أو إرجاع الأمانات" defaultChecked={permissions.canManageDeposits ?? false} />
            </div>
          </section>

          <section className="rounded-lg border bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[#061228]">بيان العهدة</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <PermissionToggle name="canViewCustodies" label="عرض العهد" description="عرض سجلات العهد" defaultChecked={permissions.canViewCustodies ?? false} />
              <PermissionToggle name="canManageCustodies" label="إدارة العهد" description="إنشاء، بيع، أو إرجاع العهد" defaultChecked={permissions.canManageCustodies ?? false} />
            </div>
          </section>


          <div className="flex justify-end gap-3 border-t pt-6">
            <Link href="/users" className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
              إلغاء
            </Link>
            <button 
              type="submit" 
              disabled={isPending}
              className="rounded-lg bg-[#dda322] px-6 py-2 text-sm font-medium text-white hover:bg-[#b8861b] transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  جاري الحفظ...
                </>
              ) : (
                "حفظ الصلاحيات"
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}