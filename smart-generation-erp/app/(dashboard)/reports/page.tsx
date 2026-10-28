import { requirePermission } from "@/lib/auth-utils"
import { getSalesVsPurchasesData, getTopProductsData, getTopCustomersData } from "@/lib/reports"
import { RevenueChart } from "./components/RevenueChart"
import { TopProductsChart } from "./components/TopProductsChart"
import { TopCustomersChart } from "./components/TopCustomersChart"
import { getCurrencySymbol } from "@/lib/settings"

export default async function ReportsPage() {
  await requirePermission("canViewReports")
  const currency = await getCurrencySymbol()

  // Fetch all data in parallel
  const [salesVsPurchases, topProducts, topCustomers] = await Promise.all([
    getSalesVsPurchasesData(),
    getTopProductsData(),
    getTopCustomersData()
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#061228]">التقارير والتحليلات</h1>
        <p className="mt-1 text-sm text-gray-500">نظرة عامة على أداء المبيعات والمشتريات.</p>
      </div>

      {/* Full Width Chart */}
      <RevenueChart data={salesVsPurchases} />

      {/* Two Column Layout */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <TopProductsChart data={topProducts} />
        <TopCustomersChart data={topCustomers} />
      </div>
    </div>
  )
}