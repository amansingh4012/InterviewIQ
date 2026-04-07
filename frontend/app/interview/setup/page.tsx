'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { useInterviewStore } from '@/store/interviewStore';
import { uploadResume, startInterview } from '@/lib/api';
import Button from '@/components/ui/Button';
import Link from 'next/link';

interface SubscriptionStatus {
  can_start: boolean;
  interviews_remaining: number | null;
  reason?: string;
  upgrade_prompt?: string;
  tier: string;
}

export default function SetupPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { user } = useUser();
  const setParsedResume = useInterviewStore(state => state.setParsedResume);
  const setResumeId = useInterviewStore(state => state.setResumeId);
  const setSessionId = useInterviewStore(state => state.setSessionId);
  const setCurrentQuestion = useInterviewStore(state => state.setCurrentQuestion);
  const setQuestionNumber = useInterviewStore(state => state.setQuestionNumber);
  const setIsAudioPlaying = useInterviewStore(state => state.setIsAudioPlaying);

  const [file, setFile] = useState<File | null>(null);
  const [role, setRole] = useState('Full Stack Developer');
  const [difficulty, setDifficulty] = useState('Junior');
  const [interviewType, setInterviewType] = useState('Mixed');
  const [isUploading, setIsUploading] = useState(false);
  const [step, setStep] = useState<'upload' | 'processing' | 'starting'>('upload');
  const [error, setError] = useState('');
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscription/can-start`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
        if (!data.can_start) {
          // Don't redirect immediately, show the upgrade prompt
        }
      }
    } catch (err) {
      console.error('Failed to check subscription:', err);
    } finally {
      setCheckingSubscription(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF resume');
      return;
    }
    
    // Double-check subscription before starting
    if (subscription && !subscription.can_start) {
      router.push('/pricing');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // Step 1: Upload & parse resume
      setStep('processing');
      const resumeData = await uploadResume(file, getToken);
      setParsedResume(resumeData.parsed_data);
      setResumeId(resumeData.resume_id);

      // Step 2: Start interview
      setStep('starting');
      const startData = await startInterview(
        {
          resume_id: resumeData.resume_id,
          role,
          difficulty,
          interview_type: interviewType,
        },
        getToken
      );

      setSessionId(startData.session_id);
      setCurrentQuestion(startData.question);
      setQuestionNumber(startData.question_number);
      setIsAudioPlaying(true);

      router.push(`/interview/${startData.session_id}`);
    } catch (err: any) {
      // Handle subscription limit error specifically
      if (err.message?.includes('subscription_limit_reached') || err.status === 403) {
        router.push('/pricing');
        return;
      }
      setError(err.message || 'An error occurred');
      setStep('upload');
      setIsUploading(false);
    }
  };

  const statusMessages = {
    upload: '',
    processing: '🔍 Analyzing your resume with AI...',
    starting: '🧠 Building personalized interview strategy...',
  };

  // Show loading while checking subscription
  if (checkingSubscription) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-[var(--accent-indigo)] border-t-transparent animate-spin" />
          <p className="text-[var(--text-secondary)]">Checking account status...</p>
        </div>
      </div>
    );
  }

  // Show upgrade prompt if limit reached
  if (subscription && !subscription.can_start) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
        <div className="gradient-orb gradient-orb-1" />
        <div className="gradient-orb gradient-orb-2" />
        
        <div className="w-full max-w-md relative z-10">
          <div className="glass-card-static p-8 text-center animate-fade-up">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              Interview Limit Reached
            </h1>
            <p className="text-[var(--text-secondary)] mb-6">
              {subscription.reason || "You've used all your free interviews."}
            </p>
            <p className="text-sm text-[var(--text-muted)] mb-6">
              {subscription.upgrade_prompt || "Upgrade to Premium for more interviews and full reports."}
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/pricing">
                <Button className="w-full">
                  ⚡ View Plans & Upgrade
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full">
                  ← Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="gradient-orb gradient-orb-1" />
      <div className="gradient-orb gradient-orb-2" />

      <div className="w-full max-w-lg relative z-10">
        {/* Subscription Status Banner */}
        {subscription && subscription.interviews_remaining !== null && subscription.interviews_remaining <= 5 && (
          <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm text-center animate-fade-up">
            ⚠️ {subscription.interviews_remaining} interview{subscription.interviews_remaining !== 1 ? 's' : ''} remaining on your plan.{' '}
            <Link href="/pricing" className="underline font-medium">Upgrade now</Link>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8 animate-fade-up">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Setup Interview</h1>
          <p className="text-[var(--text-secondary)] mt-2">Upload your resume and configure the session</p>
        </div>

        {/* Form Card */}
        <div className="glass-card-static p-8 animate-fade-up delay-100">
          {error && (
            <div className="mb-6 p-3 rounded-lg bg-[rgba(244,63,94,0.1)] border border-[rgba(244,63,94,0.2)] text-rose-400 text-sm">
              {error}
            </div>
          )}

          {step !== 'upload' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-2 border-[var(--accent-indigo)] border-t-transparent animate-spin" />
                <div className="absolute inset-0 w-14 h-14 rounded-full border-2 border-[var(--accent-cyan)] border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
              </div>
              <p className="text-[var(--text-secondary)] text-sm animate-pulse">
                {statusMessages[step]}
              </p>
            </div>
          )}

          {step === 'upload' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Resume (PDF)
                </label>
                <label className="flex flex-col items-center justify-center w-full h-32 glass-card-static cursor-pointer hover:border-[var(--accent-indigo)] transition-colors group">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-8 h-8 text-[var(--text-muted)] group-hover:text-[var(--accent-indigo)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 16V4m0 0L8 8m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                    </svg>
                    <span className="text-sm text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">
                      {file ? file.name : 'Click to upload PDF'}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Target Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="select-field"
                >
                  <option>Full Stack Developer</option>
                  <option>Frontend Developer</option>
                  <option>Backend Developer</option>
                  <option>AI/ML Engineer</option>
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Difficulty
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['Internship', 'Junior', 'Mid-level', 'Senior'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={`py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                        difficulty === d
                          ? 'bg-[var(--accent-indigo)] text-white shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                          : 'bg-[var(--bg-glass)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:border-[var(--border-active)]'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interview Type */}
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  Interview Type
                </label>
                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value)}
                  className="select-field"
                >
                  <option>Mixed</option>
                  <option>Technical</option>
                  <option>Behavioral</option>
                  <option>System Design</option>
                </select>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                isLoading={isUploading}
                disabled={!file}
                className="w-full text-base py-4"
              >
                🚀 Start Interview
              </Button>
            </form>
          )}
        </div>

        {/* Back link */}
        <div className="text-center mt-6">
          <button onClick={() => router.push('/dashboard')} className="btn-ghost text-sm">
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
