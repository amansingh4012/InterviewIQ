'use client';

import { useEffect, useRef, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { getReport } from '@/lib/api';
import ScoreCard from '@/components/report/ScoreCard';
import CategoryChart from '@/components/report/CategoryChart';
import QuestionBreakdown from '@/components/report/QuestionBreakdown';
import StudyRecommendations from '@/components/report/StudyRecommendations';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function ReportPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const data = await getReport(sessionId, () => getTokenRef.current());
        setReportData(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-2 border-[var(--accent-indigo)] border-t-transparent animate-spin" />
            <div className="absolute inset-0 w-14 h-14 rounded-full border-2 border-[var(--accent-cyan)] border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
          </div>
          <p className="text-[var(--text-secondary)] text-sm animate-pulse">
            Loading your performance report...
          </p>
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 px-4">
        <p className="text-rose-400">{error || 'Failed to load report'}</p>
        <Button onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
      </div>
    );
  }

  const { report, role, difficulty } = reportData;

  return (
    <div className="min-h-screen px-4 py-8 relative overflow-hidden">
      <div className="gradient-orb gradient-orb-1" style={{ opacity: 0.15 }} />
      <div className="gradient-orb gradient-orb-2" style={{ opacity: 0.1 }} />

      <div className="max-w-6xl mx-auto relative z-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-up">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">Performance Report</h1>
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="purple">{role}</Badge>
              <Badge variant="blue">{difficulty}</Badge>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => router.push('/interview/setup')}>
              Practice Again
            </Button>
            <Button onClick={() => router.push('/dashboard')}>
              Dashboard
            </Button>
          </div>
        </div>

        {/* Score + Chart Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-up delay-100">
          <ScoreCard
            score={report.overall_score || 0}
            grade={report.overall_grade || '?'}
            recommendation={report.hire_recommendation || 'N/A'}
          />
          <CategoryChart
            categoryScores={report.category_scores || {
              technical_knowledge: 0, project_depth: 0, system_design: 0,
              problem_solving: 0, communication: 0, dsa_fundamentals: 0,
            }}
          />
        </div>

        {/* Quick Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-up delay-200">
          <div className="glass-card-static p-5 border-l-2 border-emerald-500">
            <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
              🏆 Biggest Win
            </h3>
            <p className="text-sm text-[var(--text-primary)] leading-relaxed">
              {report.biggest_win || 'N/A'}
            </p>
          </div>
          <div className="glass-card-static p-5 border-l-2 border-rose-500">
            <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2">
              ⚠️ Critical Gap
            </h3>
            <p className="text-sm text-[var(--text-primary)] leading-relaxed">
              {report.most_critical_gap || 'N/A'}
            </p>
          </div>
          <div className="glass-card-static p-5 border-l-2 border-amber-500">
            <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
              🔧 Fix Immediately
            </h3>
            <p className="text-sm text-[var(--text-primary)] leading-relaxed">
              {report.one_thing_to_fix_immediately || 'N/A'}
            </p>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-up delay-300">
          {/* Strengths */}
          <div className="glass-card-static p-6">
            <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[rgba(16,185,129,0.15)] flex items-center justify-center text-xs">✓</span>
              Top Strengths
            </h3>
            <div className="space-y-4">
              {(report.strengths || []).map((s: any, i: number) => (
                <div key={i} className="glass-card-static p-4 border-l-2 border-emerald-500/30 animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm text-[var(--text-primary)]">{s.area}</h4>
                    <span className="text-xs font-bold text-emerald-400">{s.score}/10</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">{s.evidence}</p>
                </div>
              ))}
              {(!report.strengths || report.strengths.length === 0) && (
                <p className="text-sm text-[var(--text-muted)]">No strengths data available</p>
              )}
            </div>
          </div>

          {/* Weaknesses */}
          <div className="glass-card-static p-6">
            <h3 className="text-sm font-semibold text-rose-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[rgba(244,63,94,0.15)] flex items-center justify-center text-xs">✕</span>
              Areas to Improve
            </h3>
            <div className="space-y-4">
              {(report.weaknesses || []).map((w: any, i: number) => (
                <div key={i} className="glass-card-static p-4 border-l-2 border-rose-500/30 animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <h4 className="font-medium text-sm text-[var(--text-primary)] mb-1">{w.area}</h4>
                  <p className="text-xs text-[var(--text-secondary)] mb-2">{w.specific_gap}</p>
                  <div className="glass-card-static p-3 space-y-1">
                    <p className="text-xs text-rose-400 line-through opacity-70">
                      "{w.what_was_said}"
                    </p>
                    <p className="text-xs text-emerald-400">
                      ✓ "{w.what_should_have_been_said}"
                    </p>
                  </div>
                </div>
              ))}
              {(!report.weaknesses || report.weaknesses.length === 0) && (
                <p className="text-sm text-[var(--text-muted)]">No weaknesses data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Question Breakdown */}
        <div className="animate-fade-up delay-400">
          <QuestionBreakdown questions={report.question_by_question || []} />
        </div>

        {/* Study Recommendations */}
        <div className="animate-fade-up delay-500">
          <StudyRecommendations recommendations={report.study_recommendations || []} />
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 pb-8 animate-fade-up">
          <Button onClick={() => router.push('/interview/setup')} className="px-8">
            🔄 Practice Again
          </Button>
          <Button variant="secondary" onClick={() => router.push('/progress')} className="px-8">
            📊 View Progress
          </Button>
          <Button variant="secondary" onClick={() => router.push('/dashboard')} className="px-8">
            ← Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
