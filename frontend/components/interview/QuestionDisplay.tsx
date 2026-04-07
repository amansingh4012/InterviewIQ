'use client';

interface QuestionDisplayProps {
  question: string | null;
  questionNumber: number;
  isLoading: boolean;
  isAudioLoading?: boolean;
}

export default function QuestionDisplay({ question, questionNumber, isLoading, isAudioLoading }: QuestionDisplayProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-[var(--accent-indigo)] border-t-transparent animate-spin" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-[var(--accent-cyan)] border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
        <p className="text-[var(--text-secondary)] animate-pulse text-sm">Alex is thinking...</p>
      </div>
    );
  }

  return (
    <div className="py-8 px-4">
      <div className="flex items-center gap-3 mb-4">
        <p className="text-xs font-medium text-[var(--accent-indigo)] uppercase tracking-wider">
          Question {questionNumber}
        </p>
        {isAudioLoading && (
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
            <div className="w-2 h-2 bg-[var(--accent-cyan)] rounded-full animate-pulse" />
            <span>Preparing voice...</span>
          </div>
        )}
      </div>
      <h2 className="text-xl md:text-2xl font-medium text-[var(--text-primary)] leading-relaxed">
        {question || 'Preparing your first question...'}
      </h2>
    </div>
  );
}
