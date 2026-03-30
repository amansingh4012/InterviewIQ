'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, UserButton } from '@clerk/nextjs';
import { getUserSessions } from '@/lib/api';
import SessionCard from '@/components/dashboard/SessionCard';
import Button from '@/components/ui/Button';
import { formatScore } from '@/lib/utils';

export default function Dashboard() {
  const router = useRouter();
  const { user } = useUser();
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const data = await getUserSessions(() => getTokenRef.current());
        setSessions(data.sessions || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  const avgScore =
    sessions.length > 0
      ? sessions.reduce((acc, s) => acc + (s.report?.overall_score || 0), 0) / sessions.length
      : 0;

  const bestScore =
    sessions.length > 0
      ? Math.max(...sessions.map((s) => s.report?.overall_score || 0))
      : 0;

  return (
    <div className="min-h-screen px-4 py-8 relative overflow-hidden">
      <div className="gradient-orb gradient-orb-1" style={{ opacity: 0.15 }} />
      <div className="gradient-orb gradient-orb-2" style={{ opacity: 0.1 }} />

      <div className="max-w-6xl mx-auto relative z-10 space-y-8">
        {/* Header */}
        <div className="glass-card-static p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 animate-fade-up">
          <div className="flex items-center gap-4">
            <UserButton
              appearance={{
                elements: { avatarBox: 'w-12 h-12' },
              }}
            />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
                Welcome back, {user?.firstName || 'Candidate'}
              </h1>
              <p className="text-[var(--text-secondary)] text-sm mt-1">
                Ready for your next mock interview?
              </p>
            </div>
          </div>
          <Button onClick={() => router.push('/interview/setup')} className="shrink-0">
            🚀 Start New Interview
          </Button>
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
