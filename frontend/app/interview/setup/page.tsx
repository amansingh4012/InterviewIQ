'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { useInterviewStore } from '@/store/interviewStore';
import { uploadResume, startInterview } from '@/lib/api';
import Button from '@/components/ui/Button';
import Link from 'next/link';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a PDF resume');
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="gradient-orb gradient-orb-1" />
      <div className="gradient-orb gradient-orb-2" />

      <div className="w-full max-w-lg relative z-10">
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
                  {['Internship', 'Junior', 'Mid-Level', 'Senior'].map((d) => (
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
