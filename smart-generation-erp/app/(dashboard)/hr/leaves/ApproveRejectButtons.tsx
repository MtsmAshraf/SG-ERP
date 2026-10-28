"use client"

import { approveLeave, rejectLeave } from "./actions"
import { CheckCircle2, XCircle } from "lucide-react"

export function ApproveRejectButtons({ leaveId }: { leaveId: string }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <form action={approveLeave}>
        <input type="hidden" name="leaveId" value={leaveId} />
        <button type="submit" className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50 transition" title="اعتماد">
          <CheckCircle2 size={18} />
        </button>
      </form>
      <form action={rejectLeave}>
        <input type="hidden" name="leaveId" value={leaveId} />
        <button type="submit" className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition" title="رفض">
          <XCircle size={18} />
        </button>
      </form>
    </div>
  )
}