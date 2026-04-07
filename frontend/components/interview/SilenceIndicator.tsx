'use client';
import { useEffect, useState } from 'react';

interface SilenceIndicatorProps {
  isActive: boolean;
  secondsRemaining: number;
  onTimeout: () => void;
  totalSeconds?: number;
}

export default function SilenceIndicator({ 
  isActive, 
  secondsRemaining, 
  onTimeout,
  totalSeconds = 3 
}: SilenceIndicatorProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!isActive) {
      setProgress(100);
      return;
    }
    
    setProgress((secondsRemaining / totalSeconds) * 100);
    
    if (secondsRemaining <= 0) {
      onTimeout();
    }
  }, [isActive, secondsRemaining, totalSeconds, onTimeout]);

  if (!isActive || secondsRemaining >= totalSeconds) {
    return null;
  }

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-fade-up">
      <div className="glass-card-static px-6 py-3 flex items-center gap-4">
        {/* Countdown Circle */}
        <div className="relative w-12 h-12">
          <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
            {/* Background circle */}
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="4"
            />
            {/* Progress circle */}
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke={secondsRemaining <= 1 ? '#f43f5e' : '#6366f1'}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 20}`}
              strokeDashoffset={`${2 * Math.PI * 20 * (1 - progress / 100)}`}
              className="transition-all duration-200"
            />
          </svg>
          {/* Number */}
          <span className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${
            secondsRemaining <= 1 ? 'text-rose-400' : 'text-[var(--text-primary)]'
          }`}>
            {Math.ceil(secondsRemaining)}
          </span>
        </div>

        {/* Text */}
        <div className="flex flex-col">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {secondsRemaining <= 1 ? 'Submitting...' : 'Silence detected'}
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            {secondsRemaining > 1 ? 'Keep talking or wait to submit' : 'Processing your answer'}
          </span>
        </div>

        {/* Pulse indicator */}
        <div className={`w-3 h-3 rounded-full ${
          secondsRemaining <= 1 ? 'bg-rose-500' : 'bg-amber-500'
        } animate-pulse`} />
      </div>
    </div>
  );
}
