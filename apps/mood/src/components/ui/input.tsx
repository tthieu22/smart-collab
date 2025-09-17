"use client";

import { Input as AntInput, InputProps as AntInputProps } from 'antd';
import { cn } from '@/app/lib/utils';

interface InputProps extends Omit<AntInputProps, 'size'> {
  variant?: 'filled' | 'outlined' | 'borderless' | 'underlined';
  size?: 'small' | 'middle' | 'large';
  error?: boolean;
  success?: boolean;
  className?: string;
}
export function Input({ 
  variant = 'filled',
  size = 'middle',
  error = false,
  success = false,
  className,
  ...props 
}: InputProps) {
  const baseClasses = 'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0';
  
  const variantClasses = {
    default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
    filled: 'bg-gray-50 border-gray-300 focus:bg-white focus:border-blue-500 focus:ring-blue-500',
    outlined: 'border-2 border-gray-300 focus:border-blue-500 focus:ring-blue-500',
    borderless: 'border-0 bg-transparent focus:ring-blue-500',
    underlined: 'border-b border-gray-300 focus:border-blue-500 focus:ring-blue-500',
  };

  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    middle: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
  };

  const stateClasses = {
    error: 'border-red-500 focus:border-red-500 focus:ring-red-500',
    success: 'border-green-500 focus:border-green-500 focus:ring-green-500',
  };

  return (
    <AntInput
      className={cn(
        baseClasses, 
        variantClasses[variant],
        sizeClasses[size],
        error && stateClasses.error,
        success && stateClasses.success,
        className
      )}
      size={size}
      {...props}
    />
  );
} 