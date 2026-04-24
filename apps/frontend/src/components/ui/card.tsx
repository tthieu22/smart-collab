'use client';

import { forwardRef } from 'react';
import { Card as AntCard, CardProps as AntCardProps } from 'antd';
import { cn } from '@smart/lib/utils';

interface CardProps extends Omit<AntCardProps, 'variant'> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
  children: React.ReactNode;
  className?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({
  variant = 'default',
  padding = 'medium',
  children,
  className,
  ...props
}, ref) => {
  const baseClasses = 'transition-all duration-200';

  const variantClasses = {
    default: 'bg-white border-gray-200 dark:bg-neutral-900/50 dark:border-neutral-800',
    elevated: 'bg-white border-gray-200 shadow-lg hover:shadow-xl dark:bg-neutral-900 dark:border-neutral-800',
    outlined: 'bg-transparent border-2 border-gray-300 dark:border-neutral-700',
  };

  const paddingClasses = {
    none: 'p-0',
    small: 'p-3',
    medium: 'p-4',
    large: 'p-6',
  };

  return (
    <AntCard
      ref={ref}
      className={cn(
        baseClasses,
        variantClasses[variant],
        paddingClasses[padding],
        'font-sans',
        className
      )}
      {...props}
    >
      {children}
    </AntCard>
  );
});

Card.displayName = 'Card';
