import { requireRole } from "@/lib/auth-utils"
import { createUser } from "../actions"
import Link from "next/link"

export default async function NewUserPage() {
  await requireRole("ADMIN")

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link href="/users" className="text-sm text-blue-600 hover:underline">
          ← Back to Users
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">Add New User</h1>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <form action={createUser} className="space-y-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Full Name *</label>
            <input name="name" required className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email *</label>
            <input name="email" type="email" required className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Temporary Password *</label>
            <input name="password" type="text" required minLength={8} className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500" placeholder="Min 8 characters" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Role *</label>
            <select name="role" defaultValue="STAFF" className="w-full rounded border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500">
              <option value="STAFF">Staff (Standard Access)</option>
              <option value="ADMIN">Admin (Full Access)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 border-t pt-6">
            <Link href="/users" className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </Link>
            <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}