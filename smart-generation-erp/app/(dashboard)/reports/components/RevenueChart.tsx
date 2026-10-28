"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface DataPoint {
  month: string
  sales: number
  purchases: number
}

export function RevenueChart({ data }: { data: DataPoint[] }) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-bold text-[#061228]">المبيعات مقابل المشتريات (آخر 6 أشهر)</h3>
      <div className="h-80 w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value: any) => value?.toFixed(2) || '0.00'} />
            <Legend />
            <Line type="monotone" dataKey="sales" stroke="#dda322" strokeWidth={2} name="المبيعات" />
            <Line type="monotone" dataKey="purchases" stroke="#061228" strokeWidth={2} name="المشتريات" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}