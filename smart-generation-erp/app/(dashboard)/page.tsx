export default function DashboardPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-gray-900">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Products" value="0" />
        <StatCard title="Active Customers" value="0" />
        <StatCard title="Pending Orders" value="0" />
      </div>
      <div className="mt-8 rounded-lg border bg-white p-6 text-center text-gray-500">
        Phase 1 Complete: Foundation and Navigation Shell Ready.
      </div>
    </div>
  )
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )
}