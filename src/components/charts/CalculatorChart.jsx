import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';

export default function CalculatorChart({ horizontalBarData }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={horizontalBarData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(255, 255, 255, 0.08)" />
        <XAxis type="number" hide />
        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 500, fontFamily: 'JetBrains Mono, monospace' }} />
        <RechartsTooltip contentStyle={{ backgroundColor: '#0F1115', borderColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '16px' }} itemStyle={{ color: '#FFFFFF' }} labelStyle={{ color: '#F7931A', fontWeight: 'bold' }} cursor={{ fill: 'transparent' }} />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24} label={{ position: 'right', formatter: (v) => `${v.toFixed(1)} kg`, fill: '#94A3B8', fontSize: 10, fontWeight: 500, fontFamily: 'JetBrains Mono, monospace' }}>
          {horizontalBarData.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
