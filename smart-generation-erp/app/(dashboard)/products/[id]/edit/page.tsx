import { prisma } from "@/lib/prisma"
import { requirePermission } from "@/lib/auth-utils"
import { notFound } from "next/navigation"
import EditProductForm from "./EditProductForm"

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("canEditProducts")
  const { id } = await params

  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) notFound()

  // ✅ Convert ALL Prisma Decimals to plain JS Numbers to prevent Client Component crashes
  const productData = {
    ...product,
    costPrice: product.costPrice ? product.costPrice.toNumber() : 0,
    costPriceUSD: product.costPriceUSD.toNumber(),
    sellPriceUSD: product.sellPriceUSD.toNumber(),
  }

  return <EditProductForm product={productData} />
}