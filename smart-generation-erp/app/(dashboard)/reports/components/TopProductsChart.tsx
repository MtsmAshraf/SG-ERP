"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface DataPoint {
  name: string
  revenue: number
}

export function TopProductsChart({ data }: { data: DataPoint[] }) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-bold text-[#061228]">أعلى 5 منتجات مبيعاً</h3>
      <div className="h-80 w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip formatter={(value: any) => value?.toFixed(2) || '0.00'} />
            <Bar dataKey="revenue" fill="#dda322" name="الإيرادات" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}