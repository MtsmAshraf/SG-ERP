"use client"

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface DataPoint {
  name: string
  revenue: number
}

const COLORS = ['#dda322', '#061228', '#10b981', '#3b82f6', '#8b5cf6']

export function TopCustomersChart({ data }: { data: DataPoint[] }) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-bold text-[#061228]">أعلى 5 عملاء</h3>
      <div className="h-80 w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="revenue"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: any) => value?.toFixed(2) || '0.00'} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}