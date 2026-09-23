import React from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-panel px-4 py-3 text-xs">
      <p className="text-mist mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-mono">
          {p.name}: {p.value} kg
        </p>
      ))}
    </div>
  )
}

export default function WeeklyTrendChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4fd68f" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#4fd68f" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="recycledGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c8f169" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#c8f169" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { weekday: 'short' })}
          tick={{ fill: '#c9d1c7', fontSize: 11 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
          tickLine={false}
        />
        <YAxis tick={{ fill: '#c9d1c7', fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="total" name="Total Waste" stroke="#4fd68f" strokeWidth={2} fill="url(#totalGrad)" />
        <Area type="monotone" dataKey="recycled" name="Recycled" stroke="#c8f169" strokeWidth={2} fill="url(#recycledGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}
