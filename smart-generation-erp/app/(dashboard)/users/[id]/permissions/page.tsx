import { prisma } from "@/lib/prisma"
import { requireRole, canManageUser } from "@/lib/auth-utils"
import { notFound, redirect } from "next/navigation"
import { updateUserPermissions } from "../../actions"
import { PermissionToggle } from "../../PermissionToggle"
import Link from "next/link"
import type { Role } from "@prisma/client"
import { PermissionsForm } from "./PermissionsForm" // We will use the component for the form

export default async function UserPermissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireRole("SUPER_ADMIN", "ADMIN")
  
  const canManage = await canManageUser(id, session.user.id, session.user.role as Role)
  if (!canManage) {
    redirect("/users")
  }

  const user = await prisma.user.findUnique({
    where: { id },
    include: { permission: true }
  })

  if (!user) notFound()

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <Link href="/users" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#dda322] transition mb-2">
          ← العودة إلى المستخدمين
        </Link>
        <h1 className="text-2xl font-bold text-[#061228]">
          صلاحيات: {user.name}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          الدور: <span className="font-semibold">{user.role === "ADMIN" ? "مدير" : "موظف"}</span>
        </p>
      </div>

      {/* Render the form component which contains the floating toast */}
      <PermissionsForm 
        userId={user.id}
        userName={user.name}
        userRole={user.role}
        userEmail={user.email}
        permissions={user.permission ? (user.permission as any) : {}} 
      />
    </div>
  )
}