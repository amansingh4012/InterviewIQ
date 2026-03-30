'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface CategoryChartProps {
  categoryScores: {
    technical_knowledge: number;
    project_depth: number;
    system_design: number;
    problem_solving: number;
    communication: number;
    dsa_fundamentals: number;
  };
}

export default function CategoryChart({ categoryScores }: CategoryChartProps) {
  const chartData = [
    { subject: 'Technical', value: categoryScores.technical_knowledge || 0, fullMark: 10 },
    { subject: 'Projects', value: categoryScores.project_depth || 0, fullMark: 10 },
    { subject: 'System Design', value: categoryScores.system_design || 0, fullMark: 10 },
    { subject: 'Problem Solving', value: categoryScores.problem_solving || 0, fullMark: 10 },
    { subject: 'Communication', value: categoryScores.communication || 0, fullMark: 10 },
    { subject: 'DSA', value: categoryScores.dsa_fundamentals || 0, fullMark: 10 },
  ];

  return (
    <div className="glass-card-static p-6">
      <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-6">
        Skill Breakdown
      </h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
            <PolarGrid stroke="rgba(255,255,255,0.06)" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 10]}
              tick={false}
              axisLine={false}
            />
            <Radar
              name="Score"
              dataKey="value"
              stroke="#6366f1"
              fill="url(#radarGradient)"
              fillOpacity={0.5}
              strokeWidth={2}
            />
            <defs>
              <linearGradient id="radarGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.3} />
              </linearGradient>
            </defs>
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
