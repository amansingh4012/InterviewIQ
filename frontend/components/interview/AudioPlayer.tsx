'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';

interface AudioPlayerProps {
  text: string;
  onComplete: () => void;
  autoPlay: boolean;
}

export default function AudioPlayer({ text, onComplete, autoPlay }: AudioPlayerProps) {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const audioRef = useRef<HTMLAudioElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentUrlRef = useRef<string | null>(null);
  // Use refs for callbacks to avoid stale closures in the effect
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const cleanup = useCallback(() => {
    // Abort any in-flight fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // Revoke any existing object URL
    if (currentUrlRef.current) {
      URL.revokeObjectURL(currentUrlRef.current);
      currentUrlRef.current = null;
    }
    // Stop audio playback
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
    }
    // Stop browser TTS fallback if playing
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  useEffect(() => {
    if (!text || !autoPlay) return;

    // Clean up any previous playback before starting a new one
    cleanup();

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
          audioRef.current.onended = () => {
            // Clean up URL after playback
            if (currentUrlRef.current) {
              URL.revokeObjectURL(currentUrlRef.current);
              currentUrlRef.current = null;
            }
            onCompleteRef.current();
          };
          audioRef.current.onerror = () => {
            onCompleteRef.current();
          };
          await audioRef.current.play();
        }
      } catch (error: any) {
        if (error?.name !== 'AbortError') {
          console.error('Audio error:', error, '- Falling back to browser TTS');
          
          if (!controller.signal.aborted && typeof window !== 'undefined' && window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(text);
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

    // Cleanup on unmount or when text/autoPlay changes
    return () => {
      cleanup();
    };
  }, [text, autoPlay, cleanup]);

  return <audio ref={audioRef} className="hidden" />;
}
