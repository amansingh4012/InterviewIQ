'use client';

interface FeedbackToastProps {
  score: number;
  quality: string;
  whatYouGotRight?: string;
  areaToImprove?: string;
  isVisible: boolean;
  onDismiss: () => void;
}

export default function FeedbackToast({ 
  score, 
  quality, 
  whatYouGotRight, 
  areaToImprove,
  isVisible,
  onDismiss
}: FeedbackToastProps) {
  if (!isVisible) return null;

  const getScoreColor = () => {
    if (score >= 7.5) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 5.5) return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
    if (score >= 3.5) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  };

  const getQualityLabel = () => {
    switch (quality) {
      case 'strong': return { label: 'Strong Answer', emoji: '🎯' };
      case 'acceptable': return { label: 'Good Answer', emoji: '👍' };
      case 'weak': return { label: 'Needs Work', emoji: '💪' };
      case 'very_weak': return { label: 'Keep Practicing', emoji: '📚' };
      default: return { label: 'Evaluated', emoji: '✓' };
    }
  };

  const qualityInfo = getQualityLabel();

  return (
    <div className={`glass-card-static p-4 border ${getScoreColor()} animate-fade-up`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Score header */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-2xl">{qualityInfo.emoji}</span>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">
                {qualityInfo.label}
              </p>
              <p className={`text-lg font-bold ${getScoreColor().split(' ')[0]}`}>
                {score.toFixed(1)}/10
              </p>
            </div>
          </div>
          
          {/* Feedback details */}
          <div className="space-y-2 text-sm">
            {whatYouGotRight && (
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 shrink-0">✓</span>
                <p className="text-[var(--text-secondary)]">{whatYouGotRight}</p>
              </div>
            )}
            {areaToImprove && (
              <div className="flex items-start gap-2">
                <span className="text-amber-400 shrink-0">→</span>
                <p className="text-[var(--text-secondary)]">{areaToImprove}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Dismiss button */}
        <button 
          onClick={onDismiss}
          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
