'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, useUser, UserButton } from '@clerk/nextjs';
import { getUserSessions } from '@/lib/api';
import SessionCard from '@/components/dashboard/SessionCard';
import Button from '@/components/ui/Button';
import { formatScore } from '@/lib/utils';
import Link from 'next/link';

interface SubscriptionStatus {
  tier: string;
  interviews_remaining: number | null;
  can_start: boolean;
  upgrade_prompt?: string;
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  
  // Check for payment success
  const paymentSuccess = searchParams.get('payment') === 'success';
  const newTier = searchParams.get('tier');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessionsData, subStatus] = await Promise.all([
          getUserSessions(() => getTokenRef.current()),
          fetchSubscriptionStatus(),
        ]);
        setSessions(sessionsData.sessions || []);
        setSubscription(subStatus);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchSubscriptionStatus = async (): Promise<SubscriptionStatus | null> => {
    try {
      const token = await getTokenRef.current();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscription/can-start`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
    }
    return null;
  };

  const avgScore =
    sessions.length > 0
      ? sessions.reduce((acc, s) => acc + (s.report?.overall_score || 0), 0) / sessions.length
      : 0;

  const bestScore =
    sessions.length > 0
      ? Math.max(...sessions.map((s) => s.report?.overall_score || 0))
      : 0;
  
  const handleStartInterview = () => {
    if (subscription && !subscription.can_start) {
      router.push('/pricing');
    } else {
      router.push('/interview/setup');
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'premium':
        return 'bg-blue-500 text-white';
      case 'enterprise':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 relative overflow-hidden">
      <div className="gradient-orb gradient-orb-1" style={{ opacity: 0.15 }} />
      <div className="gradient-orb gradient-orb-2" style={{ opacity: 0.1 }} />

      <div className="max-w-6xl mx-auto relative z-10 space-y-8">
        {/* Payment Success Banner */}
        {paymentSuccess && (
          <div className="glass-card-static p-4 bg-green-50 border-green-200 animate-fade-up">
            <div className="flex items-center justify-center gap-2 text-green-800">
              <span className="text-2xl">🎉</span>
              <span className="font-medium">
                Payment successful! Welcome to {newTier || 'Premium'}. Your subscription is now active.
              </span>
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
                {subscription && (
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTierBadgeColor(subscription.tier)}`}>
                    {subscription.tier?.charAt(0).toUpperCase() + subscription.tier?.slice(1) || 'Free'}
                  </span>
                )}
              </div>
              <p className="text-[var(--text-secondary)] text-sm mt-1">
                Ready for your next mock interview?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {subscription?.tier === 'free' && (
              <Link href="/pricing">
                <Button variant="outline" className="shrink-0">
                  ⚡ Upgrade
                </Button>
              </Link>
            )}
            <Button 
              onClick={handleStartInterview} 
              className="shrink-0"
              disabled={subscription ? !subscription.can_start : undefined}
            >
              🚀 Start New Interview
            </Button>
          </div>
        </div>

        {/* Subscription Status Card */}
        {subscription && (
          <div className="glass-card-static p-4 animate-fade-up delay-50">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Interviews Remaining
                  </p>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">
                    {subscription.interviews_remaining === null ? '∞ Unlimited' : subscription.interviews_remaining}
                  </p>
                </div>
                {subscription.tier === 'free' && subscription.interviews_remaining !== null && subscription.interviews_remaining <= 3 && (
                  <div className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                    ⚠️ Running low on interviews!{' '}
                    <Link href="/pricing" className="underline font-medium">
                      Upgrade now
                    </Link>
                  </div>
                )}
              </div>
              {!subscription.can_start && (
                <div className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                  {subscription.upgrade_prompt || 'You\'ve reached your interview limit.'}{' '}
                  <Link href="/pricing" className="underline font-medium">
                    Upgrade to continue
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

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
