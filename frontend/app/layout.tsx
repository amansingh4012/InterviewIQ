import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'InterviewIQ — AI-Powered Mock Interviews',
  description:
    'Practice with a hyper-realistic AI interviewer that reads your resume, adapts in real-time, and delivers actionable performance reports.',
  keywords: ['mock interview', 'AI interview', 'interview practice', 'career prep'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: '#6366f1',
          colorBackground: '#111227',
          colorInputBackground: 'rgba(255,255,255,0.03)',
          colorInputText: '#f1f5f9',
          borderRadius: '12px',
        },
      }}
    >
      <html lang="en" className={inter.variable}>
        <body className={`${inter.className} antialiased`}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
