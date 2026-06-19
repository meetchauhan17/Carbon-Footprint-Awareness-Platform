import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

export default function HistoryChart({ barChartData, userGoalDaily }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={barChartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.08)" vertical={false} />
        <XAxis dataKey="displayDate" tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 500 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono, monospace', fontWeight: 500 }} axisLine={false} tickLine={false} unit=" kg" />
        <RechartsTooltip 
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              const isOver = payload[0].payload.totalCO2 > userGoalDaily;
              return (
                <div className="bg-[#0F1115] border border-white/10 rounded-2xl px-4 py-3 shadow-[0_0_25px_rgba(247,147,26,0.15)] text-xs text-white font-sans">
                  <p className="font-bold text-[#F7931A] mb-1 font-display">{label}</p>
                  <p className={`font-bold text-sm font-mono ${isOver ? 'text-[#EF4444]' : 'text-[#10B981]'}`}>
                    {payload[0].value.toFixed(2)} kg CO₂
                  </p>
                  <p className="text-[10px] text-clay-muted mt-0.5">{isOver ? 'Exceeds Goal' : 'Under Target'}</p>
                </div>
              )
            }
            return null;
          }} 
        />
        <ReferenceLine
          y={userGoalDaily}
          stroke="#F7931A"
          strokeDasharray="4 4"
          label={{ value: 'Daily Goal', position: 'insideTopRight', fill: '#F7931A', fontSize: 10, fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700 }}
        />
        <Bar dataKey="totalCO2" radius={[4, 4, 0, 0]}>
          {barChartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.totalCO2 > userGoalDaily ? '#F7931A' : '#10B981'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
