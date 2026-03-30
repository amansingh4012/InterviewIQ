'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  isDisabled: boolean;
}

export default function VoiceRecorder({ onTranscript, isDisabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [liveText, setLiveText] = useState('');
  const [hasSpeechAPI, setHasSpeechAPI] = useState(true);
  const [textInput, setTextInput] = useState('');
  const recognitionRef = useRef<any>(null);
  // Fix: Use a ref to track recording state so the onend handler
  // always reads the current value instead of a stale closure.
  const isRecordingRef = useRef(false);
  const transcriptRef = useRef('');

  // Keep refs in sync with state
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setHasSpeechAPI(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let interim = '';
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += text;
        else interim += text;
      }
      setLiveText(interim);
      if (finalText) setTranscript(prev => (prev + ' ' + finalText).trim());
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-available') {
        setHasSpeechAPI(false);
      }
      setIsRecording(false);
    };

    recognition.onend = () => {
      // Fix: Read from ref instead of closure to get current recording state
      if (isRecordingRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // Already started or another error
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      // Cleanup on unmount
      try {
        recognition.stop();
      } catch (e) {
        // ignore
      }
    };
  }, []);

  const startRecording = useCallback(() => {
    setTranscript('');
    setLiveText('');
    setIsRecording(true);
    try {
      recognitionRef.current?.start();
    } catch (e) {
      // Already started
    }
  }, []);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    recognitionRef.current?.stop();

    // Use ref to get latest transcript (avoids stale state in quick stop scenarios)
    const finalText = transcriptRef.current.trim();
    if (finalText) {
      onTranscript(finalText);
      setTranscript('');
      setLiveText('');
    }
  }, [onTranscript]);

  const handleTextSubmit = useCallback(() => {
    if (textInput.trim()) {
      onTranscript(textInput.trim());
      setTextInput('');
    }
  }, [textInput, onTranscript]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit();
    }
  }, [handleTextSubmit]);

  // Text input fallback
  if (!hasSpeechAPI) {
    return (
      <div className="flex flex-col gap-4 w-full">
        <div className="glass-card-static p-3">
          <p className="text-xs text-[var(--text-muted)] mb-2">
            🎤 Voice not available — type your answer below
          </p>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer here..."
            disabled={isDisabled}
            rows={4}
            className="input-field resize-none text-sm"
          />
        </div>
        <button
          onClick={handleTextSubmit}
          disabled={isDisabled || !textInput.trim()}
          className="btn-primary w-full"
        >
          Submit Answer
        </button>
      </div>
    );
  }

  // Voice recording UI
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Transcript display */}
      <div className="w-full glass-card-static p-4 min-h-[80px]">
        <p className="text-sm text-[var(--text-primary)] leading-relaxed">
          {transcript}
          {liveText && <span className="text-[var(--text-muted)]"> {liveText}</span>}
          {!transcript && !liveText && (
            <span className="text-[var(--text-muted)]">
              {isRecording ? 'Listening...' : 'Your answer will appear here'}
            </span>
          )}
        </p>
      </div>

      {/* Mic button */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isDisabled}
          className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all duration-300 ${
            isRecording
              ? 'bg-gradient-to-br from-rose-500 to-red-600 animate-pulse-ring shadow-[0_0_30px_rgba(239,68,68,0.4)]'
              : 'bg-gradient-to-br from-indigo-500 to-blue-600 hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:scale-105'
          } ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {isRecording ? '⏹' : '🎤'}
        </button>
        <p className="text-xs text-[var(--text-muted)]">
          {isRecording ? 'Click to stop & submit' : 'Click to start answering'}
        </p>
      </div>

      {/* Manual text fallback toggle */}
      {!isRecording && (
        <div className="w-full">
          <details className="group">
            <summary className="text-xs text-[var(--text-muted)] cursor-pointer hover:text-[var(--text-secondary)] transition-colors">
              Prefer typing?
            </summary>
            <div className="mt-3 flex gap-2">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your answer..."
                disabled={isDisabled}
                rows={3}
                className="input-field resize-none text-sm flex-1"
              />
              <button
                onClick={handleTextSubmit}
                disabled={isDisabled || !textInput.trim()}
                className="btn-primary shrink-0 self-end"
              >
                ↵
              </button>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
