export const PAGE_SIZE = 10

export function calculatePagination(totalItems: number, currentPage: number) {
  const totalPages = Math.ceil(totalItems / PAGE_SIZE)
  const skip = (currentPage - 1) * PAGE_SIZE

  return {
    totalPages,
    skip,
    take: PAGE_SIZE,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  }
}