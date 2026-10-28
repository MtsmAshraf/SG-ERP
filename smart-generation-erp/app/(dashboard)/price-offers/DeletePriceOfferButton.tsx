"use client"

import { useState } from "react"
import { deletePriceOffer } from "./actions"
import { Trash2 } from "lucide-react"

export function DeletePriceOfferButton({ offerId, offerNumber }: { offerId: string; offerNumber: string }) {
  const [isPending, setIsPending] = useState(false)

  const handleDelete = async (formData: FormData) => {
    if (!confirm(`هل أنت متأكد من حذف عرض السعر "${offerNumber}"؟ لا يمكن التراجع عن هذا الإجراء.`)) return
    setIsPending(true)
    try {
      await deletePriceOffer(formData)
    } catch (error: any) {
      alert(error.message || "فشل حذف عرض السعر")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form action={handleDelete}>
      <input type="hidden" name="offerId" value={offerId} />
      <button 
        type="submit" 
        disabled={isPending}
        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition disabled:opacity-50"
        title="حذف العرض"
      >
        <Trash2 size={18} />
      </button>
    </form>
  )
}