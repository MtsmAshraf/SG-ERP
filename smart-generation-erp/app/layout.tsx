import type { Metadata } from "next"
import { Cairo } from "next/font/google"
import "./globals.css"

const cairo = Cairo({ 
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
})

export const metadata: Metadata = {
  title: "Smart Generation ERP",
  description: "نظام متكامل لإدارة المبيعات، المشتريات، والمخزون",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={cairo.className}>
        {children}
      </body>
    </html>
  )
}