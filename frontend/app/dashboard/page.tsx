'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, UserButton } from '@clerk/nextjs';
import { getUserSessions } from '@/lib/api';
import SessionCard from '@/components/dashboard/SessionCard';
import Button from '@/components/ui/Button';
import { formatScore } from '@/lib/utils';
import Link from 'next/link';

function DashboardContent() {
  const router = useRouter();
  const { user } = useUser();
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setError(null);
      try {
        const sessionsData = await getUserSessions(() => getTokenRef.current());
        setSessions(sessionsData.sessions || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to load dashboard data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const avgScore =
    sessions.length > 0
      ? sessions.reduce((acc, s) => acc + (s.report?.overall_score || 0), 0) / sessions.length
      : 0;

  const bestScore =
    sessions.length > 0
      ? Math.max(...sessions.map((s) => s.report?.overall_score || 0))
      : 0;
  
  const handleStartInterview = () => {
    router.push('/interview/setup');
  };

  return (
    <div className="min-h-screen px-4 py-8 relative overflow-hidden">
      <div className="gradient-orb gradient-orb-1" style={{ opacity: 0.15 }} />
      <div className="gradient-orb gradient-orb-2" style={{ opacity: 0.1 }} />

      <div className="max-w-6xl mx-auto relative z-10 space-y-8">
        {/* Error Banner */}
        {error && (
          <div className="glass-card-static p-4 bg-red-50 border-red-200 animate-fade-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-800">
                <span className="text-xl">⚠️</span>
                <span>{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="glass-card-static p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 animate-fade-up">
          <div className="flex items-center gap-4">
            <UserButton
              appearance={{
                elements: { avatarBox: 'w-12 h-12' },
              }}
            />
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
                  Welcome back, {user?.firstName || 'Candidate'}
                </h1>
              </div>
              <p className="text-[var(--text-secondary)] text-sm mt-1">
                Ready for your next mock interview?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={handleStartInterview} 
              className="shrink-0"
            >
              🚀 Start New Interview
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-up delay-100">
          <div className="glass-card-static p-6 text-center">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Total Sessions
            </p>
            <p className="text-4xl font-bold text-[var(--text-primary)] mt-2">{sessions.length}</p>
          </div>
          <div className="glass-card-static p-6 text-center">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Average Score
            </p>
            <p className="text-4xl font-bold mt-2">
              <span className="text-[var(--accent-indigo)]">{formatScore(avgScore)}</span>
              <span className="text-lg text-[var(--text-muted)]">/10</span>
            </p>
          </div>
          <div
            className="glass-card p-6 text-center cursor-pointer"
            onClick={() => router.push('/progress')}
          >
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Best Score
            </p>
            <p className="text-4xl font-bold mt-2">
              <span className="text-emerald-400">{formatScore(bestScore)}</span>
              <span className="text-lg text-[var(--text-muted)]">/10</span>
            </p>
            <p className="text-xs text-[var(--accent-indigo)] mt-2 font-medium">
              View Progress →
            </p>
          </div>
        </div>

        {/* Past Sessions */}
        <div className="animate-fade-up delay-200">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Past Sessions</h2>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="glass-card-static p-6">
                  <div className="skeleton h-4 w-1/2 mb-3" />
                  <div className="skeleton h-3 w-1/3 mb-6" />
                  <div className="skeleton h-8 w-20 ml-auto" />
                </div>
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="glass-card-static p-12 text-center">
              <div className="text-4xl mb-4">🎯</div>
              <p className="text-[var(--text-secondary)] mb-4">
                You haven&apos;t completed any interviews yet.
              </p>
              <Button onClick={() => router.push('/interview/setup')} size="sm">
                Take your first interview
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((session, i) => (
                <SessionCard key={session._id || i} session={session} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--accent-indigo)] border-t-transparent animate-spin" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
