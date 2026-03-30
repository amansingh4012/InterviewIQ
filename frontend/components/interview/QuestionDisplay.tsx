'use client';

interface QuestionDisplayProps {
  question: string | null;
  questionNumber: number;
  isLoading: boolean;
}

export default function QuestionDisplay({ question, questionNumber, isLoading }: QuestionDisplayProps) {
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
      <p className="text-xs font-medium text-[var(--accent-indigo)] uppercase tracking-wider mb-4">
        Question {questionNumber}
      </p>
      <h2 className="text-xl md:text-2xl font-medium text-[var(--text-primary)] leading-relaxed typing-cursor">
        {question || 'Preparing your first question...'}
      </h2>
    </div>
  );
}
