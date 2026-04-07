'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { getSubscriptionPlans, getSubscriptionStatus } from '@/lib/api';
import Button from './Button';

interface SubscriptionStatus {
  tier: string;
  can_start_interview: boolean;
  interviews_remaining: number | null;
  reason: string | null;
  upgrade_prompt: string | null;
  completed_interviews: number;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  period?: string;
  features: string[];
  limitations?: string[];
  popular?: boolean;
}

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
}

export function UpgradeModal({ isOpen, onClose, reason }: UpgradeModalProps) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      getSubscriptionPlans()
        .then((data) => setPlans(data.plans || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    // In production, this would redirect to Stripe/Razorpay checkout
    // For now, show a placeholder message
    alert(`Redirecting to payment for ${planId} plan...\n\nIntegrate Stripe or Razorpay here.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-4xl glass-card-static p-8 animate-fade-up max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🚀</div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">
            Unlock Unlimited Practice
          </h2>
          <p className="text-[var(--text-secondary)] mt-2">
            {reason === 'demo_limit_reached' 
              ? "You've used all your free demo interviews. Upgrade to continue practicing!"
              : "Choose a plan to accelerate your interview preparation"}
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-indigo)] border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`glass-card-static p-6 relative ${
                  plan.popular ? 'ring-2 ring-[var(--accent-indigo)]' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[var(--accent-indigo)] text-white text-xs font-semibold rounded-full">
                    Most Popular
                  </div>
                )}

                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  {plan.name}
                </h3>
                
                <div className="mt-4">
                  <span className="text-3xl font-bold text-[var(--text-primary)]">
                    ${plan.price}
                  </span>
                  {plan.period && (
                    <span className="text-[var(--text-muted)]">/{plan.period}</span>
                  )}
                </div>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                      <span className="text-emerald-400 shrink-0">✓</span>
                      {feature}
                    </li>
                  ))}
                  {plan.limitations?.map((limitation, i) => (
                    <li key={`lim-${i}`} className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                      <span className="text-rose-400 shrink-0">✕</span>
                      {limitation}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  variant={plan.id === 'free' ? 'secondary' : 'primary'}
                  className="w-full mt-6"
                  disabled={plan.id === 'free'}
                >
                  {plan.id === 'free' ? 'Current Plan' : 'Upgrade Now'}
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Footer note */}
        <p className="text-center text-xs text-[var(--text-muted)] mt-8">
          Secure payment powered by Stripe. Cancel anytime.
        </p>
      </div>
    </div>
  );
}

interface SubscriptionBannerProps {
  className?: string;
}

export function SubscriptionBanner({ className = '' }: SubscriptionBannerProps) {
  const { getToken } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    getSubscriptionStatus(getToken)
      .then(setStatus)
      .catch(console.error);
  }, [getToken]);

  if (!status) return null;

  // Don't show banner for premium users with plenty of interviews
  if (status.tier !== 'free' && (status.interviews_remaining === null || status.interviews_remaining > 10)) {
    return null;
  }

  const isUrgent = status.tier === 'free' && (status.interviews_remaining || 0) <= 2;

  return (
    <>
      <div className={`glass-card-static p-4 flex items-center justify-between gap-4 ${
        isUrgent ? 'border-amber-500/30 bg-amber-500/5' : ''
      } ${className}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
            isUrgent ? 'bg-amber-500/20' : 'bg-[var(--accent-indigo)]/20'
          }`}>
            {isUrgent ? '⚠️' : '💎'}
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {status.tier === 'free' 
                ? `${status.interviews_remaining} free interviews remaining`
                : status.upgrade_prompt
              }
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {status.tier === 'free'
                ? 'Upgrade for unlimited practice'
                : `${status.interviews_remaining} interviews this month`
              }
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant={isUrgent ? 'primary' : 'secondary'}
          onClick={() => setShowUpgrade(true)}
        >
          Upgrade
        </Button>
      </div>

      <UpgradeModal 
        isOpen={showUpgrade} 
        onClose={() => setShowUpgrade(false)}
        reason={status.reason || undefined}
      />
    </>
  );
}

export function DemoLimitReached({ onUpgrade }: { onUpgrade?: () => void }) {
  const [showUpgrade, setShowUpgrade] = useState(false);

  return (
    <>
      <div className="glass-card-static p-12 text-center max-w-md mx-auto">
        <div className="text-5xl mb-4">🎯</div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
          Demo Limit Reached
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          You've completed all 10 free demo interviews. Upgrade to Premium for unlimited practice and detailed feedback.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => setShowUpgrade(true)}>
            🚀 Upgrade Now
          </Button>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-4">
          Plans start at $19/month
        </p>
      </div>

      <UpgradeModal 
        isOpen={showUpgrade} 
        onClose={() => setShowUpgrade(false)}
        reason="demo_limit_reached"
      />
    </>
  );
}
