import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-panel px-4 py-3 text-xs">
      <p className="text-mist mb-1">{label}</p>
      <p className="font-mono text-emerald-300">Recycling rate: {payload[0].value}%</p>
    </div>
  )
}

export default function MonthlyRateChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: '#c9d1c7', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
        <YAxis tick={{ fill: '#c9d1c7', fontSize: 11 }} axisLine={false} tickLine={false} width={36} unit="%" />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.rate >= 60 ? '#4fd68f' : entry.rate >= 30 ? '#c8f169' : '#e6b85c'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
