import Link from "next/link"
import { calculatePagination } from "@/lib/pagination"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface PaginationProps {
  totalItems: number
  currentPage: number
  baseUrl: string // e.g., "/products"
  searchQuery?: string // To persist the search term across pages
}

export function Pagination({ totalItems, currentPage, baseUrl, searchQuery }: PaginationProps) {
  const { totalPages, hasNextPage, hasPrevPage } = calculatePagination(totalItems, currentPage)

  if (totalPages <= 1) return null

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams()
    if (page > 1) params.set("page", page.toString())
    if (searchQuery) params.set("search", searchQuery)
    return `${baseUrl}?${params.toString()}`
  }

  return (
    <div className="mt-6 flex items-center justify-between border-t bg-white px-4 py-3 sm:px-6 rounded-b-lg">
      <div className="flex flex-1 justify-between sm:justify-end gap-2">
        {hasPrevPage ? (
          <Link href={createPageUrl(currentPage - 1)} className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <ChevronLeft size={16} className="mr-1" /> Previous
          </Link>
        ) : (
          <button disabled className="relative inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">
            <ChevronLeft size={16} className="mr-1" /> Previous
          </button>
        )}

        <span className="flex items-center text-sm text-gray-700">
          Page {currentPage} of {totalPages}
        </span>

        {hasNextPage ? (
          <Link href={createPageUrl(currentPage + 1)} className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Next <ChevronRight size={16} className="ml-1" />
          </Link>
        ) : (
          <button disabled className="relative inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">
            Next <ChevronRight size={16} className="ml-1" />
          </button>
        )}
      </div>
    </div>
  )
}