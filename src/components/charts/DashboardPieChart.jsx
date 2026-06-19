import React from 'react';
import { PieChart, Pie, Legend, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const isPie = !label || typeof label === 'number';
  const title = isPie ? payload[0]?.name : label;
  const showNameInLine = !isPie;
  return (
    <div className="bg-[#0F1115]/90 backdrop-blur-md border border-white/12 rounded-xl px-4 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.6),_0_0_15px_rgba(247,147,26,0.15)] text-xs font-bold font-sans">
      {title && <p className="text-[#F7931A] mb-2 font-display uppercase tracking-wider text-[10px]">{title}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mt-1 first:mt-0">
          <span className="w-2.5 h-2.5 rounded-full border border-black/40 shadow-sm" style={{ backgroundColor: p.color ?? p.fill }} />
          <p className="text-white font-medium">
            {showNameInLine ? `${p.name}: ` : ''}
            <span className="font-mono font-bold text-gray-200">{parseFloat(p.value).toFixed(1)} kg</span>
          </p>
        </div>
      ))}
    </div>
  );
};

export default function DashboardPieChart({ catBreakdown }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={[{ value: 1 }]}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          dataKey="value"
          fill="rgba(255, 255, 255, 0.03)"
          stroke="none"
          isAnimationActive={false}
        />
        <Pie
          data={catBreakdown}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={4}
          dataKey="value"
          animationBegin={200}
          animationDuration={800}
          stroke="#0F1115"
          strokeWidth={2.5}
        >
          {catBreakdown.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
        <Legend 
          verticalAlign="bottom" 
          height={36} 
          content={(props) => {
            const { payload } = props;
            return (
              <div className="flex flex-wrap justify-center gap-3 mt-4">
                {payload.map((entry, index) => (
                  <div key={`item-${index}`} className="flex items-center gap-1.5 font-bold font-sans">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-xs text-clay-text font-mono">{entry.value}</span>
                    <span className="text-xs text-clay-muted">({((catBreakdown.find(c => c.name === entry.value)?.value / catBreakdown.reduce((a,b)=>a+b.value,0)) * 100).toFixed(0)}%)</span>
                  </div>
                ))}
              </div>
            );
          }}
        />
        <text x="50%" y="44%" textAnchor="middle" dominantBaseline="middle" className="text-[10px] font-extrabold fill-[#F7931A] uppercase tracking-widest font-display">
          TOTAL CO₂
        </text>
        <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" className="text-lg font-black fill-white font-mono">
          {catBreakdown.reduce((a,b) => a+b.value, 0).toFixed(1)}<tspan fontSize="10" fontWeight="bold" fill="#94A3B8" fontFamily="Inter, sans-serif"> kg</tspan>
        </text>
      </PieChart>
    </ResponsiveContainer>
  );
}
