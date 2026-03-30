export function getGradeColor(grade: string): string {
  const colors: Record<string, string> = {
    A: '#10b981',
    B: '#3b82f6',
    C: '#f59e0b',
    D: '#f97316',
    F: '#f43f5e',
  };
  return colors[grade] || '#94a3b8';
}

export function getScoreColor(score: number): string {
  if (score >= 8) return '#10b981';
  if (score >= 6) return '#3b82f6';
  if (score >= 4) return '#f59e0b';
  return '#f43f5e';
}

export function getQualityBadge(quality: string): { label: string; className: string } {
  const map: Record<string, { label: string; className: string }> = {
    strong: { label: 'Strong', className: 'badge-green' },
    acceptable: { label: 'Acceptable', className: 'badge-blue' },
    weak: { label: 'Weak', className: 'badge-amber' },
    very_weak: { label: 'Needs Work', className: 'badge-red' },
  };
  return map[quality] || { label: quality, className: 'badge-blue' };
}

export function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatScore(score: number | undefined | null): string {
  if (score === undefined || score === null) return '0.0';
  return score.toFixed(1);
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high':
      return 'badge-red';
    case 'medium':
      return 'badge-amber';
    case 'low':
      return 'badge-blue';
    default:
      return 'badge-blue';
  }
}
