import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

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

export default function DashboardAreaChart({ weeklyData, dailyGoal, onChartClick }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart 
        data={weeklyData} 
        margin={{ top: 5, right: 10, left: -15, bottom: 0 }}
        onClick={(e) => {
          if (e && e.activePayload && e.activePayload.length > 0) {
            if (onChartClick) onChartClick();
          }
        }}
        className="cursor-pointer font-mono"
      >
        <defs>
          <linearGradient id="colorCo2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#F7931A" stopOpacity={0.25}/>
            <stop offset="95%" stopColor="#F7931A" stopOpacity={0}/>
          </linearGradient>
          <filter id="areaGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx={0} dy={4} stdDeviation={5} floodColor="#F7931A" floodOpacity={0.35} />
          </filter>
        </defs>
        <CartesianGrid vertical={false} stroke="rgba(255, 255, 255, 0.04)" />
        <XAxis dataKey="day" tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 30]} tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'JetBrains Mono' }} axisLine={false} tickLine={false} unit=" kg" />
        <Tooltip content={<ChartTooltip />} />
        <ReferenceLine
          y={dailyGoal}
          stroke="rgba(247, 147, 26, 0.3)"
          strokeDasharray="5 5"
          strokeWidth={1.5}
          label={{ value: `Goal ${dailyGoal}kg`, position: 'insideTopRight', offset: 10, fontSize: 10, fill: '#94A3B8', fontFamily: 'JetBrains Mono', fontWeight: 'bold' }}
        />
        <Area 
          type="monotone" 
          dataKey="co2" 
          name="Emissions" 
          stroke="#F7931A" 
          strokeWidth={2} 
          fillOpacity={1} 
          fill="url(#colorCo2)" 
          activeDot={{ r: 6, fill: '#F7931A', stroke: '#030304', strokeWidth: 2 }}
        />
        <Area 
          type="monotone" 
          dataKey="co2" 
          stroke="#F7931A" 
          strokeWidth={3} 
          fill="none"
          filter="url(#areaGlow)"
          legendType="none"
          activeDot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
