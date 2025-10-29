'use client';

import { cn } from '@smart/lib/utils';
import { useBoardStore } from '@smart/store/board';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'small' | 'middle' | 'large';
  active?: boolean;
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'default',
  size = 'middle',
  active = false,
  loading = false,
  children,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const theme = useBoardStore((s) => s.theme);

  // Màu giống nút Create Board
  const variantClasses = {
    default: theme === 'dark'
      ? 'bg-gray-700 text-white hover:bg-gray-600'
      : 'bg-gray-200 text-black hover:bg-gray-300',
    primary: theme === 'dark'
      ? 'bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-700'
      : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700',
    secondary: theme === 'dark'
      ? 'bg-gray-600 text-white hover:bg-gray-500'
      : 'bg-gray-300 text-black hover:bg-gray-400',
    ghost: 'bg-transparent text-blue-500 hover:bg-blue-100',
    danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
    success: 'bg-green-500 text-white hover:bg-green-600 active:bg-green-700',
  };

  const sizeClasses: Record<string, string> = {
    small: 'px-3 py-1 text-sm',
    middle: 'px-4 py-2 text-base',
    large: 'px-6 py-3 text-lg',
  };

  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'font-medium transition-all duration-150 rounded-lg flex items-center justify-center gap-2',
        variantClasses[variant],
        sizeClasses[size],
        active && 'ring-2 ring-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.3)]',
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5" />
      ) : (
        children
      )}
    </button>
  );
}
