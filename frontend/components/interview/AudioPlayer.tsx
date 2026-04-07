'use client';
import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

interface AudioPlayerProps {
  text: string;
  onComplete: () => void;
  autoPlay: boolean;
  onAudioReady?: () => void; // Called when audio is loaded and about to play
}

export default function AudioPlayer({ text, onComplete, autoPlay, onAudioReady }: AudioPlayerProps) {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentUrlRef = useRef<string | null>(null);
  const onCompleteRef = useRef(onComplete);
  const onAudioReadyRef = useRef(onAudioReady);
  onCompleteRef.current = onComplete;
  onAudioReadyRef.current = onAudioReady;

  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current);
      currentUrlRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!text || !autoPlay) return;

    cleanup();
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const playAudio = async () => {
      try {
        const token = await getTokenRef.current();
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/voice/synthesize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ text }),
          signal: controller.signal,
        });

        if (!response.ok) throw new Error('Voice synthesis failed');

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        currentUrlRef.current = audioUrl;

        if (audioRef.current && !controller.signal.aborted) {
          audioRef.current.src = audioUrl;
          
          // Wait for audio to be ready before playing
          audioRef.current.oncanplaythrough = () => {
            setIsLoading(false);
            onAudioReadyRef.current?.();
          };
          
          audioRef.current.onended = () => {
            if (currentUrlRef.current) {
              URL.revokeObjectURL(currentUrlRef.current);
              currentUrlRef.current = null;
            }
            onCompleteRef.current();
          };
          audioRef.current.onerror = () => {
            setIsLoading(false);
            onCompleteRef.current();
          };
          
          // Start playing - audio is ready
          await audioRef.current.play();
        }
      } catch (error: any) {
        setIsLoading(false);
        if (error?.name !== 'AbortError') {
          console.error('Audio error:', error, '- Falling back to browser TTS');
          
          if (!controller.signal.aborted && typeof window !== 'undefined' && window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.95; // Slightly slower for clarity
            utterance.onstart = () => {
              onAudioReadyRef.current?.();
            };
            utterance.onend = () => {
              onCompleteRef.current();
            };
            utterance.onerror = () => {
              onCompleteRef.current();
            };
            window.speechSynthesis.speak(utterance);
          } else {
            onCompleteRef.current();
          }
        }
      }
    };

    playAudio();

    return () => {
      cleanup();
    };
  }, [text, autoPlay, cleanup]);

  return (
    <>
      <audio ref={audioRef} className="hidden" />
      {isLoading && (
        <div className="fixed bottom-4 right-4 bg-[var(--bg-tertiary)] px-3 py-2 rounded-lg text-xs text-[var(--text-muted)] flex items-center gap-2 z-50">
          <div className="w-3 h-3 border border-[var(--accent-indigo)] border-t-transparent rounded-full animate-spin" />
          Preparing audio...
        </div>
      )}
    </>
  );
}
