'use client';

import { Input as AntInput, InputProps as AntInputProps } from 'antd';
import { cn } from '@smart/lib/utils';
import { useBoardStore } from '@smart/store/setting';

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
  const theme = useBoardStore((s) => s.theme);

  const baseClasses =
    'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0';

  const variantClasses = {
    default: theme === 'dark'
      ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:bg-gray-700 focus:border-blue-500 focus:ring-blue-500'
      : 'border-gray-300 bg-white text-black placeholder-gray-500 focus:bg-gray-100 focus:border-blue-500 focus:ring-blue-500',
    filled: theme === 'dark'
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:bg-gray-800 focus:border-blue-500 focus:ring-blue-500'
      : 'bg-gray-100 border-gray-300 text-black placeholder-gray-500 focus:bg-white focus:border-blue-500 focus:ring-blue-500',
    outlined: theme === 'dark'
      ? 'border-2 border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:bg-gray-700 focus:border-blue-500 focus:ring-blue-500'
      : 'border-2 border-gray-300 bg-white text-black placeholder-gray-500 focus:bg-gray-50 focus:border-blue-500 focus:ring-blue-500',
    borderless: theme === 'dark'
      ? 'border-0 bg-gray-800 text-white placeholder-gray-400 focus:bg-gray-700 focus:ring-blue-500'
      : 'border-0 bg-white text-black placeholder-gray-500 focus:bg-gray-100 focus:ring-blue-500',
    underlined: theme === 'dark'
      ? 'border-b border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:bg-gray-700 focus:border-blue-500 focus:ring-blue-500'
      : 'border-b border-gray-300 bg-white text-black placeholder-gray-500 focus:bg-gray-100 focus:border-blue-500 focus:ring-blue-500',
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
