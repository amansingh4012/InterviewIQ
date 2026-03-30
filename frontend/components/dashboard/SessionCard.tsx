'use client';

import { useRouter } from 'next/navigation';
import { getGradeColor, getScoreColor, formatScore, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';

interface SessionCardProps {
  session: {
    session_id: string;
    role: string;
    difficulty: string;
    created_at: string;
    report?: {
      overall_score?: number;
      overall_grade?: string;
    };
  };
  index: number;
}

export default function SessionCard({ session, index }: SessionCardProps) {
  const router = useRouter();
  const score = session.report?.overall_score || 0;
  const grade = session.report?.overall_grade || '?';
  const gradeColor = getGradeColor(grade);
  const scoreColor = getScoreColor(score);

  return (
    <div
      onClick={() => router.push(`/interview/report/${session.session_id}`)}
      className="glass-card p-5 cursor-pointer animate-fade-up group relative overflow-hidden"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Accent line */}
      <div
        className="absolute top-0 left-0 w-full h-0.5 opacity-60"
        style={{ background: `linear-gradient(90deg, ${gradeColor}, transparent)` }}
      />

      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-[var(--text-primary)] text-sm">{session.role}</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{session.difficulty}</p>
        </div>
        <span
          className="text-xl font-bold"
          style={{ color: gradeColor }}
        >
          {grade}
        </span>
      </div>

      <div className="flex justify-between items-end">
        <span className="text-xs text-[var(--text-muted)]">
          {formatDate(session.created_at)}
        </span>
        <div className="text-right">
          <span className="text-lg font-bold" style={{ color: scoreColor }}>
            {formatScore(score)}
          </span>
          <span className="text-xs text-[var(--text-muted)]">/10</span>
        </div>
      </div>
    </div>
  );
}
