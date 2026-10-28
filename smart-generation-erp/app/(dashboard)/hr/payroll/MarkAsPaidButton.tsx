"use client"

import { markAsPaid } from "./actions"
import { CheckCircle2 } from "lucide-react"

export function MarkAsPaidButton({ payslipId }: { payslipId: string }) {
  return (
    <form action={markAsPaid}>
      <input type="hidden" name="payslipId" value={payslipId} />
      <button 
        type="submit" 
        className="flex items-center gap-1 text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 transition text-xs font-medium"
        title="تسجيل كمدفوع"
      >
        <CheckCircle2 size={16} /> دفع
      </button>
    </form>
  )
}