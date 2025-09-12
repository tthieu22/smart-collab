"use client";

import { Button as AntButton, ButtonProps as AntButtonProps } from 'antd';
import { cn } from '@/app/lib/utils';

interface ButtonProps extends Omit<AntButtonProps, 'type' | 'variant'> {
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'small' | 'middle' | 'large';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Button({ 
  variant = 'default', 
  size = 'middle',
  loading = false,
  disabled = false,
  children,
  className,
  ...props 
}: ButtonProps) {
  const baseClasses = 'font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    default: 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:ring-blue-500',
    primary: 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 hover:border-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 border-gray-600 text-white hover:bg-gray-700 hover:border-gray-700 focus:ring-gray-500',
    ghost: 'bg-transparent border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:ring-blue-500',
    danger: 'bg-red-600 border-red-600 text-white hover:bg-red-700 hover:border-red-700 focus:ring-red-500',
    success: 'bg-green-600 border-green-600 text-white hover:bg-green-700 hover:border-green-700 focus:ring-green-500',
  };

  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    middle: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
  };

  return (
    <AntButton
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      size={size}
      loading={loading}
      disabled={disabled}
      {...props}
    >
      {children}
    </AntButton>
  );
} 