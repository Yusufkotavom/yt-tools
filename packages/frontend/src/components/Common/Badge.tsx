import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
  className?: string;
}

export default function Badge({
  children,
  variant = 'default',
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        {
          'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400': variant === 'default',
          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300': variant === 'secondary',
          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400': variant === 'success',
          'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400': variant === 'warning',
          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400': variant === 'danger',
          'border border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-300': variant === 'outline',
        },
        className
      )}
    >
      {children}
    </span>
  );
}
