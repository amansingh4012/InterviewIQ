'use client';

import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

interface ProgressChartProps {
  data: Array<{ session_number: number; average_score: number }>;
}

export default function ProgressChart({ data }: ProgressChartProps) {
  const chartData = data.map((d) => ({
    name: `#${d.session_number}`,
    score: Number(d.average_score.toFixed(1)),
  }));

  return (
    <div className="glass-card-static p-6 h-80">
      <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-6">
        Score Trend
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="rgba(255,255,255,0.04)"
          />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 12 }}
            dy={8}
          />
          <YAxis
            domain={[0, 10]}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 12 }}
            dx={-8}
          />
          <Tooltip
            contentStyle={{
              background: '#111227',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              color: '#f1f5f9',
            }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="#6366f1"
            strokeWidth={3}
            fill="url(#scoreGradient)"
            dot={{ r: 5, fill: '#6366f1', strokeWidth: 2, stroke: '#111227' }}
            activeDot={{ r: 7, strokeWidth: 0, fill: '#818cf8' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
