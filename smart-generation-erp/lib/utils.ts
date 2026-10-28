export function serializeCustomer(customer: any) {
  return {
    ...customer,
    salePercentage: customer.salePercentage?.toNumber() ?? 0,
  }
}export function serializeProduct(product: any) {
  return {
    ...product,
    costPrice: product.costPrice?.toNumber() ?? 0,
    // sellPrice: product.sellPrice?.toNumber() ?? 0,
  }
}