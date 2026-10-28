"use client"

import { markInvoiceAsPaid } from "./actions"
import { CheckCircle2 } from "lucide-react"

export function MarkInvoicePaidButton({ invoiceId }: { invoiceId: string }) {
  return (
    <form action={markInvoiceAsPaid}>
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <button 
        type="submit" 
        className="flex items-center gap-1 text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 transition text-xs font-medium"
        title="تسجيل كمدفوعة"
      >
        <CheckCircle2 size={16} /> دفع
      </button>
    </form>
  )
}