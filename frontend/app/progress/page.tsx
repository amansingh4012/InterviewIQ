'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { getProgress } from '@/lib/api';
import ProgressChart from '@/components/dashboard/ProgressChart';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function ProgressPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const json = await getProgress(() => getTokenRef.current());
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-[var(--accent-indigo)] border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  if (!data || data.sessions_completed < 2) {
    return (
      <div className="min-h-screen flex justify-center items-center flex-col gap-6 px-4">
        <div className="glass-card-static p-12 text-center max-w-md">
          <div className="text-5xl mb-4">📈</div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Keep Practicing!</h2>
          <p className="text-[var(--text-secondary)] text-sm">
            You need at least 2 completed sessions to see progress trends.
            <br />
            <span className="text-[var(--accent-indigo)] font-medium">
              {data?.sessions_completed || 0} / 2 completed
            </span>
          </p>
          <div className="progress-track mt-4">
            <div
              className="progress-fill"
              style={{ width: `${((data?.sessions_completed || 0) / 2) * 100}%` }}
            />
          </div>
          <div className="flex gap-3 justify-center mt-6">
            <Button onClick={() => router.push('/interview/setup')} size="sm">
              Start Interview
            </Button>
            <Button variant="secondary" onClick={() => router.push('/dashboard')} size="sm">
              Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { analytics, ai_insights } = data;

  const trajConfig: Record<string, { color: string; badge: 'green' | 'amber' | 'red'; emoji: string }> = {
    improving: { color: 'text-emerald-400', badge: 'green', emoji: '📈' },
    stagnant: { color: 'text-amber-400', badge: 'amber', emoji: '➡️' },
    declining: { color: 'text-rose-400', badge: 'red', emoji: '📉' },
  };

  const traj = trajConfig[analytics.trajectory] || trajConfig.stagnant;

  return (
    <div className="min-h-screen px-4 py-8 relative overflow-hidden">
      <div className="gradient-orb gradient-orb-1" style={{ opacity: 0.15 }} />

      <div className="max-w-5xl mx-auto relative z-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-up">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">Progress Trends</h1>
            <p className="text-[var(--text-secondary)] text-sm mt-1">
              Based on {data.sessions_completed} mock interviews
            </p>
          </div>
          <Button variant="secondary" onClick={() => router.push('/dashboard')}>
            ← Dashboard
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-up delay-100">
          <div className="glass-card-static p-6">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Trajectory
            </p>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{traj.emoji}</span>
              <span className={`text-2xl font-bold capitalize ${traj.color}`}>
                {analytics.trajectory}
              </span>
            </div>
          </div>

          <div className="glass-card-static p-6">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              First → Latest
            </p>
            <div className="flex items-center gap-2">
              <span className="text-lg text-[var(--text-muted)]">
                {analytics.first_average?.toFixed(1)}
              </span>
              <span className="text-[var(--text-muted)]">→</span>
              <span className="text-2xl font-bold text-[var(--text-primary)]">
                {analytics.latest_average?.toFixed(1)}
              </span>
            </div>
          </div>

          <div className="glass-card-static p-6">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
              Total Improvement
            </p>
            <p className={`text-2xl font-bold ${analytics.total_improvement > 0 ? 'text-emerald-400' : analytics.total_improvement < 0 ? 'text-rose-400' : 'text-[var(--text-primary)]'}`}>
              {analytics.total_improvement > 0 ? '+' : ''}
              {analytics.total_improvement?.toFixed(1)} pts
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="animate-fade-up delay-200">
          <ProgressChart data={analytics.session_scores || []} />
        </div>

        {/* AI Coaching Insights */}
        {ai_insights && (
          <div className="glass-card-static p-6 border-l-2 border-[var(--accent-indigo)] animate-fade-up delay-200">
            <h3 className="text-sm font-semibold text-[var(--accent-indigo)] uppercase tracking-wider mb-4">
              🧠 AI Coaching Insights
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Readiness Assessment */}
              {ai_insights.readiness_assessment && (
                <div className="glass-card-static p-4">
                  <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Interview Readiness</p>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-lg font-bold ${ai_insights.readiness_assessment.ready_for_interviews ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {ai_insights.readiness_assessment.ready_for_interviews ? '✅ Ready' : '⏳ Not Yet'}
                    </span>
                  </div>
                  {ai_insights.readiness_assessment.estimated_weeks_to_ready > 0 && (
                    <p className="text-xs text-[var(--text-secondary)]">
                      ~{ai_insights.readiness_assessment.estimated_weeks_to_ready} week(s) of practice recommended
                    </p>
                  )}
                  <Badge variant={ai_insights.readiness_assessment.confidence_level === 'high' ? 'green' : ai_insights.readiness_assessment.confidence_level === 'medium' ? 'amber' : 'red'} className="mt-2">
                    {ai_insights.readiness_assessment.confidence_level} confidence
                  </Badge>
                </div>
              )}

              {/* Improvement Rate */}
              <div className="glass-card-static p-4">
                <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">Improvement Rate</p>
                <p className="text-lg font-bold text-[var(--text-primary)] capitalize">
                  {ai_insights.improvement_rate || 'N/A'}
                </p>
                {ai_insights.overall_trajectory && (
                  <p className="text-xs text-[var(--text-secondary)] mt-1 capitalize">
                    Overall: {ai_insights.overall_trajectory}
                  </p>
                )}
              </div>
            </div>

            {/* Consistent Strengths */}
            {ai_insights.consistent_strengths?.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-emerald-400 mb-2">💪 Consistent Strengths</p>
                <div className="flex flex-wrap gap-2">
                  {ai_insights.consistent_strengths.map((s: string, i: number) => (
                    <Badge key={i} variant="green">{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Resolved Weaknesses */}
            {ai_insights.resolved_weaknesses?.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-blue-400 mb-2">🎉 Resolved Weaknesses</p>
                <div className="flex flex-wrap gap-2">
                  {ai_insights.resolved_weaknesses.map((s: string, i: number) => (
                    <Badge key={i} variant="blue">{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* This Week's Focus */}
            {ai_insights.this_week_focus && (
              <div className="glass-card-static p-4 mt-3 border-l-2 border-amber-500">
                <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
                  🎯 This Week&apos;s Focus
                </p>
                <p className="text-sm text-[var(--text-primary)]">{ai_insights.this_week_focus}</p>
              </div>
            )}

            {/* Motivational Note */}
            {ai_insights.motivational_note && (
              <div className="mt-4 p-4 rounded-xl bg-[rgba(99,102,241,0.06)] border border-[rgba(99,102,241,0.15)]">
                <p className="text-sm text-[var(--text-secondary)] italic">
                  &ldquo;{ai_insights.motivational_note}&rdquo;
                </p>
              </div>
            )}
          </div>
        )}

        {/* Weak Areas */}
        {analytics.persistent_weak_areas?.length > 0 && (
          <div className="glass-card-static p-6 border-l-2 border-rose-500 animate-fade-up delay-300">
            <h3 className="text-sm font-semibold text-rose-400 uppercase tracking-wider mb-3">
              ⚠️ Persistent Weak Areas
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              You regularly score below 5 in these areas:
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {analytics.persistent_weak_areas.map((area: string, i: number) => (
                <Badge key={i} variant="red">{area}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="flex justify-center pt-4 pb-8 animate-fade-up delay-400">
          <Button onClick={() => router.push('/interview/setup')}>
            🎯 Practice More
          </Button>
        </div>
      </div>
    </div>
  );
}
