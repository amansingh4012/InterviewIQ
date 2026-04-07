'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import Link from 'next/link';

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  period?: string;
  features: string[];
  limitations?: string[];
  popular?: boolean;
  cta: string;
}

function PricingPageContent() {
  const { isSignedIn, getToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [currentTier, setCurrentTier] = useState<string>('free');
  const [error, setError] = useState<string | null>(null);
  
  const paymentStatus = searchParams.get('payment');

  useEffect(() => {
    fetchPlans();
    if (isSignedIn) {
      fetchCurrentSubscription();
    }
  }, [isSignedIn]);

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscription/plans`);
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans);
      }
    } catch (err) {
      console.error('Failed to fetch plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscription/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentTier(data.tier || 'free');
      }
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
    }
  };

  const handleCheckout = async (planId: string) => {
    if (!isSignedIn) {
      router.push('/sign-in?redirect_url=/pricing');
      return;
    }

    if (planId === 'free' || planId === currentTier) {
      return;
    }

    setCheckoutLoading(planId);
    setError(null);

    try {
      const token = await getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscription/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tier: planId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create checkout session');
      }

      const data = await response.json();
      
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setCheckoutLoading(null);
    }
  };

  const getButtonText = (plan: Plan) => {
    if (plan.id === currentTier) return 'Current Plan';
    if (plan.id === 'free') return isSignedIn ? 'Current Plan' : 'Get Started';
    return plan.cta || 'Upgrade';
  };

  const isButtonDisabled = (plan: Plan) => {
    return plan.id === currentTier || (plan.id === 'free' && isSignedIn);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--accent-indigo)] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-12 relative overflow-hidden">
      <div className="gradient-orb gradient-orb-1" style={{ opacity: 0.15 }} />
      <div className="gradient-orb gradient-orb-2" style={{ opacity: 0.1 }} />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Back button */}
        <Link 
          href="/dashboard" 
          className="inline-flex items-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-8 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>

        {/* Payment status messages */}
        {paymentStatus === 'cancelled' && (
          <div className="mb-8 p-4 glass-card-static bg-amber-500/10 border-amber-500/20 text-amber-400 text-center animate-fade-up">
            Payment was cancelled. No charges were made.
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-12 animate-fade-up">
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
            Ace your next interview with AI-powered practice sessions and detailed feedback
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-8 p-4 glass-card-static bg-rose-500/10 border-rose-500/20 text-rose-400 text-center">
            {error}
          </div>
        )}

        {/* Pricing cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, idx) => (
            <div 
              key={plan.id}
              className={`glass-card-static p-6 flex flex-col relative animate-fade-up ${
                plan.popular ? 'ring-2 ring-[var(--accent-indigo)] scale-[1.02]' : ''
              } ${plan.id === currentTier ? 'ring-2 ring-emerald-500' : ''}`}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              {/* Badges */}
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-semibold bg-[var(--accent-indigo)] text-white rounded-full">
                  Most Popular
                </span>
              )}
              {plan.id === currentTier && (
                <span className="absolute -top-3 right-4 px-3 py-1 text-xs font-semibold bg-emerald-500 text-white rounded-full">
                  Current
                </span>
              )}
              
              {/* Plan Header */}
              <div className="text-center mb-6 pt-2">
                <div className="mx-auto mb-4 p-3 bg-[var(--glass-bg)] rounded-full w-fit">
                  {plan.id === 'free' && <span className="text-2xl">✨</span>}
                  {plan.id === 'premium' && <span className="text-2xl">⚡</span>}
                  {plan.id === 'enterprise' && <span className="text-2xl">🏢</span>}
                </div>
                <h3 className="text-2xl font-bold text-[var(--text-primary)]">{plan.name}</h3>
                <div className="mt-2">
                  <span className="text-4xl font-bold text-[var(--text-primary)]">
                    ${plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-[var(--text-muted)]">/{plan.period}</span>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="flex-grow mb-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-[var(--text-secondary)]">{feature}</span>
                    </li>
                  ))}
                  {plan.limitations?.map((limitation, index) => (
                    <li key={`limit-${index}`} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-[var(--text-muted)]">{limitation}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Button */}
              <Button
                variant={plan.id === 'free' ? 'secondary' : 'primary'}
                className="w-full"
                disabled={isButtonDisabled(plan) || checkoutLoading === plan.id}
                isLoading={checkoutLoading === plan.id}
                onClick={() => handleCheckout(plan.id)}
              >
                {getButtonText(plan)}
              </Button>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: '400ms' }}>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div className="glass-card-static p-4">
              <h3 className="font-semibold text-[var(--text-primary)]">Can I cancel anytime?</h3>
              <p className="text-[var(--text-secondary)] text-sm mt-1">
                Yes! Cancel any time. You keep access until the billing period ends.
              </p>
            </div>
            <div className="glass-card-static p-4">
              <h3 className="font-semibold text-[var(--text-primary)]">What happens if I downgrade?</h3>
              <p className="text-[var(--text-secondary)] text-sm mt-1">
                Your interviews stay accessible. Detailed reports show limited info on the free plan.
              </p>
            </div>
            <div className="glass-card-static p-4">
              <h3 className="font-semibold text-[var(--text-primary)]">Do unused interviews roll over?</h3>
              <p className="text-[var(--text-secondary)] text-sm mt-1">
                Monthly counts reset each cycle. Free plan gets 10 total interviews (lifetime).
              </p>
            </div>
          </div>
        </div>

        {/* Money-back guarantee */}
        <div className="mt-8 text-center glass-card-static p-4 max-w-md mx-auto bg-emerald-500/10">
          <p className="text-emerald-400 font-medium">
            ✨ 7-Day Money-Back Guarantee
          </p>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Not satisfied? Full refund within 7 days.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--accent-indigo)] border-t-transparent animate-spin" />
      </div>
    }>
      <PricingPageContent />
    </Suspense>
  );
}
