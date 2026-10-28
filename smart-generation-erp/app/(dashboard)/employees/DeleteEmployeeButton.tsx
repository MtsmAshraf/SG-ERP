"use client"

import { useState } from "react"
import { deleteEmployee } from "../hr/employees/actions"; 
import { Trash2 } from "lucide-react"

export function DeleteEmployeeButton({ employeeId, employeeName }: { employeeId: string; employeeName: string }) {
  const [isPending, setIsPending] = useState(false)

  const handleDelete = async (formData: FormData) => {
    if (!confirm(`هل أنت متأكد من حذف الموظف "${employeeName}"؟ لا يمكن التراجع عن هذا الإجراء.`)) return
    setIsPending(true)
    try {
      await deleteEmployee(formData)
    } catch (error: any) {
      alert(error.message || "فشل حذف الموظف")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form action={handleDelete}>
      <input type="hidden" name="employeeId" value={employeeId} />
      <button 
        type="submit" 
        disabled={isPending}
        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition disabled:opacity-50"
        title="حذف الموظف"
      >
        <Trash2 size={18} />
      </button>
    </form>
  )
}