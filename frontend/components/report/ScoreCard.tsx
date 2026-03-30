'use client';

import { getGradeColor, getScoreColor, formatScore } from '@/lib/utils';

interface ScoreCardProps {
  score: number;
  grade: string;
  recommendation: string;
}

export default function ScoreCard({ score, grade, recommendation }: ScoreCardProps) {
  const gradeColor = getGradeColor(grade);
  const scoreColor = getScoreColor(score);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 10) * circumference;

  return (
    <div className="glass-card-static p-8 flex flex-col items-center justify-center text-center">
      {/* Circular Score */}
      <div className="relative w-36 h-36 mb-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <circle
            cx="60" cy="60" r="54" fill="none"
            stroke={scoreColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold" style={{ color: scoreColor }}>
            {formatScore(score)}
          </span>
          <span className="text-xs text-[var(--text-muted)]">/10</span>
        </div>
      </div>

      {/* Grade */}
      <div className="flex items-center gap-3 mb-3">
        <span
          className="text-3xl font-bold"
          style={{ color: gradeColor }}
        >
          {grade}
        </span>
        <span className="text-[var(--text-muted)] text-sm">Grade</span>
      </div>

      {/* Recommendation */}
      <div className="glass-card-static px-4 py-2 text-sm">
        <span className="text-[var(--text-muted)]">Recommendation: </span>
        <span className="font-semibold text-[var(--text-primary)]">{recommendation}</span>
      </div>
    </div>
  );
}
