'use client';

import { useState } from 'react';
import { getScoreColor, formatScore } from '@/lib/utils';

interface QuestionItem {
  question: string;
  answer_summary: string;
  score: number;
  feedback: string;
}

interface QuestionBreakdownProps {
  questions: QuestionItem[];
}

export default function QuestionBreakdown({ questions }: QuestionBreakdownProps) {
  const [expanded, setExpanded] = useState<number | null>(null);

  if (!questions || questions.length === 0) return null;

  return (
    <div className="glass-card-static p-6">
      <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-6">
        Question-by-Question
      </h3>
      <div className="space-y-3">
        {questions.map((q, i) => {
          const isOpen = expanded === i;
          const scoreColor = getScoreColor(q.score);
          return (
            <div
              key={i}
              className="glass-card-static overflow-hidden transition-all duration-300 cursor-pointer"
              onClick={() => setExpanded(isOpen ? null : i)}
            >
              <div className="flex items-center justify-between p-4 gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" 
                        style={{ background: `${scoreColor}22`, color: scoreColor }}>
                    {i + 1}
                  </span>
                  <p className="text-sm text-[var(--text-primary)] truncate">{q.question}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-bold text-sm" style={{ color: scoreColor }}>
                    {formatScore(q.score)}
                  </span>
                  <svg
                    className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                  >
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {isOpen && (
                <div className="px-4 pb-4 pt-0 border-t border-[var(--border-subtle)] mt-0">
                  <div className="pt-3 space-y-2">
                    <p className="text-sm text-[var(--text-secondary)]">
                      <span className="font-medium text-[var(--text-primary)]">Answer: </span>
                      {q.answer_summary}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      <span className="font-medium text-[var(--accent-indigo)]">Feedback: </span>
                      {q.feedback}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
