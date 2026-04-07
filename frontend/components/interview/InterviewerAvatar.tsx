'use client';

import { useState, useEffect } from 'react';

interface InterviewerAvatarProps {
  isThinking?: boolean;
  isListening?: boolean;
  isSpeaking?: boolean;
  mood?: 'neutral' | 'interested' | 'concerned' | 'impressed';
  size?: 'sm' | 'md' | 'lg';
}

export default function InterviewerAvatar({ 
  isThinking = false, 
  isListening = false,
  isSpeaking = false,
  mood = 'neutral',
  size = 'md'
}: InterviewerAvatarProps) {
  const [animationFrame, setAnimationFrame] = useState(0);

  // Subtle animation for lifelike feel
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationFrame((prev) => (prev + 1) % 100);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  const moodColors = {
    neutral: 'from-indigo-500 to-blue-600',
    interested: 'from-emerald-500 to-teal-600',
    concerned: 'from-amber-500 to-orange-600',
    impressed: 'from-purple-500 to-pink-600'
  };

  const moodEmojis = {
    neutral: '🧑‍💼',
    interested: '🤔',
    concerned: '😐',
    impressed: '😊'
  };

  // Pulse effect for different states
  const pulseClass = isThinking 
    ? 'animate-pulse' 
    : isSpeaking 
    ? 'animate-pulse-ring' 
    : '';

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Avatar container */}
      <div className={`relative ${sizeClasses[size]}`}>
        {/* Outer glow ring */}
        <div 
          className={`absolute inset-0 rounded-full bg-gradient-to-br ${moodColors[mood]} opacity-30 blur-md ${pulseClass}`}
          style={{ transform: `scale(${1.1 + Math.sin(animationFrame / 10) * 0.05})` }}
        />
        
        {/* Main avatar circle */}
        <div 
          className={`relative w-full h-full rounded-full bg-gradient-to-br ${moodColors[mood]} flex items-center justify-center shadow-lg ${pulseClass}`}
        >
          {/* Avatar emoji/icon */}
          <span className={`${size === 'lg' ? 'text-4xl' : size === 'md' ? 'text-2xl' : 'text-lg'}`}>
            {isThinking ? '🤔' : isListening ? '👂' : isSpeaking ? '🗣️' : moodEmojis[mood]}
          </span>
          
          {/* Speaking indicator waves */}
          {isSpeaking && (
            <div className="absolute -right-1 -bottom-1 flex gap-0.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-1 bg-white rounded-full animate-pulse"
                  style={{
                    height: `${8 + Math.sin((animationFrame + i * 20) / 5) * 4}px`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
          )}
          
          {/* Listening indicator */}
          {isListening && (
            <div className="absolute -right-1 -bottom-1 w-4 h-4 rounded-full bg-red-500 animate-pulse flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
          )}
        </div>
        
        {/* Thinking dots */}
        {isThinking && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[var(--accent-indigo)]"
                style={{
                  animation: 'bounce 1.4s infinite ease-in-out',
                  animationDelay: `${i * 0.16}s`
                }}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Name label */}
      <div className="text-center">
        <p className="text-xs font-medium text-[var(--text-primary)]">Alex Chen</p>
        <p className="text-[10px] text-[var(--text-muted)]">
          {isThinking ? 'Analyzing...' : isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : 'Senior Interviewer'}
        </p>
      </div>
    </div>
  );
}
