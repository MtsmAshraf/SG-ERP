"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

interface SidebarLinkProps {
  href: string
  icon: React.ReactNode
  label: string
}

export function SidebarLink({ href, icon, label }: SidebarLinkProps) {
  const pathname = usePathname()
  
  // Determine if link is active
  // For dashboard root, exact match
  // For other routes, check if pathname starts with the href
  const isActive = href === "/dashboard"
    ? pathname === "/dashboard"
    : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
        isActive
          ? "bg-orange-500 text-white shadow-md"
          : "text-gray-300 hover:bg-gray-800 hover:text-white"
      }`}
    >
      <span className={isActive ? "text-white" : "text-gray-400"}>
        {icon}
      </span>
      <span>{label}</span>
      {isActive && (
        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white" />
      )}
    </Link>
  )
}