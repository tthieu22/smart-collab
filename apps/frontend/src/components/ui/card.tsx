'use client';

import { Card as AntCard, CardProps as AntCardProps } from 'antd';
import { cn } from '@smart/lib/utils';

interface CardProps extends Omit<AntCardProps, 'variant'> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
  children: React.ReactNode;
  className?: string;
}

export function Card({
  variant = 'default',
  padding = 'medium',
  children,
  className,
  ...props
}: CardProps) {
  const baseClasses = 'transition-all duration-200';

  const variantClasses = {
    default: 'bg-white border border-gray-200',
    elevated: 'bg-white border border-gray-200 shadow-lg hover:shadow-xl',
    outlined: 'bg-transparent border-2 border-gray-300',
  };

  const paddingClasses = {
    none: 'p-0',
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8',
  };

  return (
    <AntCard
      className={cn(
        baseClasses,
        variantClasses[variant],
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </AntCard>
  );
}
