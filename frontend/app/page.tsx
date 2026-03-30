import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col">
      {/* Animated gradient orbs */}
      <div className="gradient-orb gradient-orb-1" />
      <div className="gradient-orb gradient-orb-2" />
      <div className="gradient-orb gradient-orb-3" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm">
            IQ
          </div>
          <span className="font-semibold text-lg text-[var(--text-primary)]">InterviewIQ</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in" className="btn-ghost text-sm">
            Sign In
          </Link>
          <Link href="/sign-up" className="btn-primary text-sm py-2 px-5">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-16 md:py-24">
        <div className="max-w-4xl text-center space-y-8 animate-fade-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[rgba(99,102,241,0.1)] border border-[rgba(99,102,241,0.2)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-[var(--text-secondary)]">AI-Powered Interview Practice</span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
            <span className="text-[var(--text-primary)]">Nail your next </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400">
              interview.
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto animate-fade-up delay-100">
            Practice with a hyper-realistic AI interviewer that reads your resume, adapts to your answers in real-time, and delivers actionable performance reports.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-fade-up delay-200">
            <Link href="/dashboard" className="btn-primary text-white text-base py-4 px-10">
              Start Practicing Free
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link href="/sign-in" className="btn-secondary text-white text-base py-4 px-10">
              Sign In
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 animate-fade-up delay-300">
          {[
            {
              icon: '📄',
              title: 'Resume-Aware AI',
              desc: 'Upload your PDF and the AI reads, understands, and asks questions about YOUR actual projects and skills.',
            },
            {
              icon: '🎙️',
              title: 'Voice Interviews',
              desc: 'Speak your answers naturally. The AI listens, evaluates, and asks smart follow-ups — just like a real interviewer.',
            },
            {
              icon: '📊',
              title: 'Performance Reports',
              desc: 'Get detailed scores, gap analysis, and study recommendations after every session. Track improvement over time.',
            },
          ].map((f, i) => (
            <div
              key={i}
              className="glass-card-static p-6 text-center animate-fade-up"
              style={{ animationDelay: `${400 + i * 100}ms` }}
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-2">{f.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-xs text-[var(--text-muted)]">
        Built by Aman Kumar Singh · InterviewIQ © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
