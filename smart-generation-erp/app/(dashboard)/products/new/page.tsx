import { requirePermission } from "@/lib/auth-utils"
import NewProductForm from "../NewProductForm"

export default async function NewProductPage() {
  // ✅ Server-side permission check
  await requirePermission("canCreateProducts")
  
  // ✅ Render the client form component
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#061228]">إضافة منتج جديد</h1>
        <p className="mt-1 text-sm text-gray-500">أدخل تفاصيل المنتج الجديد لإضافته إلى الكتالوج.</p>
      </div>
      
      <NewProductForm />
    </div>
  )
}