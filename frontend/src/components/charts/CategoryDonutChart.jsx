import React from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const PALETTE = ['#4fd68f', '#c8f169', '#7ee6ac', '#33a06d', '#e6b85c', '#8fa8ff', '#f4a3a3']

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const p = payload[0]
  return (
    <div className="glass-panel px-4 py-3 text-xs">
      <p className="capitalize font-medium text-offwhite">{p.name}</p>
      <p className="font-mono text-emerald-300">{p.value} kg</p>
    </div>
  )
}

export default function CategoryDonutChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="quantity"
          nameKey="category"
          innerRadius={62}
          outerRadius={92}
          paddingAngle={3}
          cornerRadius={6}
        >
          {data.map((entry, i) => (
            <Cell key={entry.category} fill={PALETTE[i % PALETTE.length]} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span className="text-mist text-xs capitalize">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
