'use client';

import { getPriorityColor } from '@/lib/utils';

interface Recommendation {
  topic: string;
  why: string;
  resource: string;
  priority: string;
}

interface StudyRecommendationsProps {
  recommendations: Recommendation[];
}

export default function StudyRecommendations({ recommendations }: StudyRecommendationsProps) {
  if (!recommendations || recommendations.length === 0) return null;

  const sorted = [...recommendations].sort((a, b) => {
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
    return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
  });

  return (
    <div className="glass-card-static p-6">
      <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-6">
        📚 Study Recommendations
      </h3>
      <div className="space-y-4">
        {sorted.map((rec, i) => (
          <div
            key={i}
            className="glass-card-static p-4 animate-fade-up"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <h4 className="font-semibold text-[var(--text-primary)] text-sm">{rec.topic}</h4>
              <span className={`badge ${getPriorityColor(rec.priority)} shrink-0`}>
                {rec.priority}
              </span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-2">{rec.why}</p>
            <p className="text-xs text-[var(--accent-cyan)]">
              📖 {rec.resource}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
