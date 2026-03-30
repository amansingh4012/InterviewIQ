'use client';

import { getQualityBadge, formatScore } from '@/lib/utils';

interface HistoryEntry {
  question: string;
  answer: string;
  score?: number;
  quality?: string;
}

interface ConversationHistoryProps {
  history: HistoryEntry[];
}

export default function ConversationHistory({ history }: ConversationHistoryProps) {
  if (history.length === 0) return null;

  return (
    <div className="mt-6 space-y-3 max-h-60 overflow-y-auto pr-2">
      <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">
        Previous Questions
      </p>
      {history.map((entry, i) => {
        const badge = entry.quality ? getQualityBadge(entry.quality) : null;
        return (
          <div
            key={i}
            className="glass-card-static p-4 text-sm animate-fade-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex justify-between items-start gap-2 mb-1">
              <p className="text-[var(--text-secondary)] font-medium">
                Q{i + 1}: {entry.question.slice(0, 80)}{entry.question.length > 80 ? '...' : ''}
              </p>
              {badge && (
                <span className={`badge ${badge.className} shrink-0`}>{badge.label}</span>
              )}
            </div>
            <p className="text-[var(--text-muted)] text-xs mt-1">
              {entry.answer.slice(0, 100)}{entry.answer.length > 100 ? '...' : ''}
            </p>
          </div>
        );
      })}
    </div>
  );
}
