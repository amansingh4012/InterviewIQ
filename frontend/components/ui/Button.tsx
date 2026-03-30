'use client';

import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseClass = variant === 'primary' ? 'btn-primary' :
                    variant === 'secondary' ? 'btn-secondary' :
                    variant === 'ghost' ? 'btn-ghost' :
                    'btn-primary';

  const sizeClass = size === 'sm' ? 'text-sm py-2 px-4' :
                    size === 'lg' ? 'text-lg py-4 px-8' :
                    'text-base py-3 px-6';

  const dangerStyle = variant === 'danger' ? 'bg-gradient-to-r from-rose-500 to-red-600' : '';

  return (
    <button
      className={cn(baseClass, sizeClass, dangerStyle, className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
