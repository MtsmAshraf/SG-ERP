"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Lock, Mail, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة")
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (err) {
      setError("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4" dir="rtl">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-8 shadow-xl">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#061228]">Smart Generation ERP</h1>
          <p className="mt-2 text-sm text-gray-600">سجل الدخول للوصول إلى لوحة التحكم</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 pr-10 pl-3 py-2.5 text-gray-900 placeholder-gray-400 focus:border-[#dda322] focus:ring-2 focus:ring-[#dda322]/20 outline-none transition"
                  placeholder="admin@erp.local"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
                كلمة المرور
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-gray-300 pr-10 pl-3 py-2.5 text-gray-900 placeholder-gray-400 focus:border-[#dda322] focus:ring-2 focus:ring-[#dda322]/20 outline-none transition"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full justify-center rounded-lg bg-[#dda322] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#b8861b] focus:outline-none focus:ring-2 focus:ring-[#dda322] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500">
          <p>نظام متكامل لإدارة المبيعات، المشتريات، والمخزون</p>
          <p className="mt-1">
            تطوير:{" "}
            <a href="https://moatasim-ashraf.vercel.app/" target="_blank" rel="noopener noreferrer" className="font-medium text-[#dda322] hover:underline">
              معتصم أشرف
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}