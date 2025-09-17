'use client';

import { cn } from '@smart/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'small' | 'middle' | 'large';
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'default',
  size = 'middle',
  loading = false,
  children,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const baseClasses =
    'font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-md flex items-center justify-center';

  const variantClasses: Record<string, string> = {
    default: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:ring-blue-500',
    primary: 'bg-blue-600 border border-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 border border-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    ghost: 'bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
    danger: 'bg-red-600 border border-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    success: 'bg-green-600 border border-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  };

  const sizeClasses: Record<string, string> = {
    small: 'px-3 py-1.5 text-sm',
    middle: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
  };

  return (
    <button
      disabled={disabled || loading}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {loading ? <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5" /> : children}
    </button>
  );
}
