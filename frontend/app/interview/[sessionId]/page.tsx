'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useInterviewStore } from '@/store/interviewStore';
import { submitAnswer, getActiveSession } from '@/lib/api';
import AudioPlayer from '@/components/interview/AudioPlayer';
import VoiceRecorder from '@/components/interview/VoiceRecorder';
import QuestionDisplay from '@/components/interview/QuestionDisplay';
import ConversationHistory from '@/components/interview/ConversationHistory';
import InterviewTimer from '@/components/interview/InterviewTimer';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';

export default function InterviewSession({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const {
    currentQuestion,
    questionNumber,
    conversationHistory,
    isAudioPlaying,
    isLoading,
    setSessionId,
    setCurrentQuestion,
    setQuestionNumber,
    addToHistory,
    setIsAudioPlaying,
    setIsLoading,
  } = useInterviewStore();

  const [nudgeText, setNudgeText] = useState('');
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);

  // Session recovery: if Zustand state is empty (page refresh), fetch from API
  useEffect(() => {
    setSessionId(sessionId);

    const needsRecovery = !currentQuestion && questionNumber === 0;
    if (!needsRecovery) return;

    const recoverSession = async () => {
      setIsRecovering(true);
      try {
        const data = await getActiveSession(sessionId, () => getTokenRef.current());

        if (data.status === 'completed') {
          // SECURITY: Validate redirect URL before navigation
          const redirectTo = data.redirect_to || `/interview/report/${sessionId}`;
          const isValidRedirect = redirectTo.startsWith('/interview/') || redirectTo.startsWith('/dashboard');
          router.replace(isValidRedirect ? redirectTo : `/interview/report/${sessionId}`);
          return;
        }

        // Restore state
        setCurrentQuestion(data.current_question);
        setQuestionNumber(data.question_number);

        // Restore conversation history by replacing (not appending) to prevent duplication
        if (data.conversation && data.conversation.length > 0) {
          // Clear existing history and set restored entries at once
          useInterviewStore.setState({
            conversationHistory: data.conversation.map((entry: any) => ({
              question: entry.question,
              answer: entry.answer,
              score: entry.score,
            })),
          });
        }
      } catch (err: any) {
        setErrorMessage(
          err.message || 'Failed to recover session. The session may not exist or has expired.'
        );
      } finally {
        setIsRecovering(false);
      }
    };

    recoverSession();
  }, [sessionId, currentQuestion, questionNumber, setSessionId, setCurrentQuestion, setQuestionNumber, router]);

  const handleSubmitAnswer = async (answer: string) => {
    setIsLoading(true);
    setNudgeText('');
    setLastScore(null);
    setErrorMessage('');

    try {
      const data = await submitAnswer(
        { session_id: sessionId, answer },
        () => getTokenRef.current()
      );

      addToHistory({
        question: currentQuestion || '',
        answer,
        score: data.evaluation_preview?.score,
      });

      if (data.status === 'complete') {
        // SECURITY: Validate redirect URL before navigation
        const redirectTo = data.redirect_to || `/interview/report/${sessionId}`;
        const isValidRedirect = redirectTo.startsWith('/interview/') || redirectTo.startsWith('/dashboard');
        router.push(isValidRedirect ? redirectTo : `/interview/report/${sessionId}`);
      } else {
        setCurrentQuestion(data.question);
        setQuestionNumber(data.question_number);
        setLastScore(data.evaluation_preview?.score || null);
        setIsAudioLoading(true);
        setIsAudioPlaying(true);
      }
    } catch (error: any) {
      setErrorMessage(
        error.message || 'Failed to submit your answer. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestHint = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const data = await submitAnswer(
        { session_id: sessionId, answer: '', request_nudge: true },
        () => getTokenRef.current()
      );
      if (data.type === 'nudge') {
        setNudgeText(data.nudge);
      }
    } catch (error: any) {
      setErrorMessage('Failed to get a hint. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const progress = (questionNumber / 10) * 100;

  // Recovery loading state
  if (isRecovering) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-2 border-[var(--accent-indigo)] border-t-transparent animate-spin" />
            <div className="absolute inset-0 w-14 h-14 rounded-full border-2 border-[var(--accent-cyan)] border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          <p className="text-[var(--text-secondary)] text-sm animate-pulse">
            Restoring your interview session...
          </p>
        </div>
      </div>
    );
  }

  // Fatal error state (session not found)
  if (errorMessage && !currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-6 px-4">
        <div className="glass-card-static p-12 text-center max-w-md">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Session Error</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">{errorMessage}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => router.push('/interview/setup')} size="sm">
              Start New Interview
            </Button>
            <Button variant="secondary" onClick={() => router.push('/dashboard')} size="sm">
              Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8 relative overflow-hidden">
      <div className="gradient-orb gradient-orb-1" style={{ opacity: 0.2 }} />

      <div className="w-full max-w-3xl relative z-10 space-y-6">
        {/* Header Bar */}
        <div className="glass-card-static p-4 flex items-center justify-between animate-fade-up">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold text-xs">
              IQ
            </div>
            <span className="font-medium text-[var(--text-primary)] text-sm">Live Interview</span>
          </div>

          <div className="flex items-center gap-4">
            <InterviewTimer isActive={!isLoading} />
            <Badge variant="purple">
              {questionNumber}/10
            </Badge>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="progress-track animate-fade-up delay-100">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Inline Error Banner */}
        {errorMessage && currentQuestion && (
          <div className="p-3 rounded-xl bg-[rgba(244,63,94,0.1)] border border-[rgba(244,63,94,0.2)] flex items-center justify-between gap-3 animate-fade-up">
            <p className="text-sm text-rose-400">⚠️ {errorMessage}</p>
            <button
              onClick={() => setErrorMessage('')}
              className="text-rose-400 hover:text-rose-300 text-lg shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Interview Card */}
        <div className="glass-card-static p-8 animate-fade-up delay-200">
          {/* Question */}
          <QuestionDisplay
            question={currentQuestion}
            questionNumber={questionNumber}
            isLoading={isLoading}
            isAudioLoading={isAudioLoading}
          />

          {/* Last Score Flash */}
          {lastScore !== null && !isLoading && (
            <div className="flex justify-center mb-4 animate-fade-up">
              <div className="glass-card-static px-4 py-2 flex items-center gap-2 text-sm">
                <span className="text-[var(--text-muted)]">Last answer:</span>
                <span className={`font-bold ${lastScore >= 7 ? 'text-emerald-400' : lastScore >= 5 ? 'text-blue-400' : 'text-amber-400'}`}>
                  {lastScore.toFixed(1)}/10
                </span>
              </div>
            </div>
          )}

          {/* Hint Area */}
          {nudgeText && (
            <div className="mb-6 p-4 rounded-xl bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] animate-fade-up">
              <p className="text-sm text-amber-300">
                💡 {nudgeText}
              </p>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-[var(--border-subtle)] my-6" />

          {/* Voice Recorder */}
          <VoiceRecorder
            onTranscript={handleSubmitAnswer}
            isDisabled={isLoading || isAudioPlaying}
          />

          {/* Hint Button */}
          <div className="flex justify-center mt-4">
            <button
              onClick={handleRequestHint}
              disabled={isLoading || isAudioPlaying || !!nudgeText}
              className="btn-ghost text-xs"
            >
              Need a hint?
            </button>
          </div>
        </div>

        {/* Conversation History */}
        <ConversationHistory
          history={conversationHistory.map(h => ({
            ...h,
            quality: h.score !== undefined ? (h.score >= 7 ? 'strong' : h.score >= 5 ? 'acceptable' : 'weak') : undefined,
          }))}
        />
      </div>

      {/* Audio Player */}
      {currentQuestion && (
        <AudioPlayer
          text={currentQuestion}
          autoPlay={isAudioPlaying}
          onAudioReady={() => setIsAudioLoading(false)}
          onComplete={() => {
            setIsAudioPlaying(false);
            setIsAudioLoading(false);
          }}
        />
      )}
    </div>
  );
}
