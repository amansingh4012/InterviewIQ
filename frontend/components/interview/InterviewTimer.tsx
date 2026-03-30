'use client';

import { useState, useEffect } from 'react';

interface InterviewTimerProps {
  isActive: boolean;
}

export default function InterviewTimer({ isActive }: InterviewTimerProps) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
      <span className="font-mono tabular-nums">
        {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
      </span>
    </div>
  );
}
