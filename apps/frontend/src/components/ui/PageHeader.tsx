'use client';

import React from 'react';
import { cn } from '@smart/lib/utils';
import { motion } from 'framer-motion';

interface PageHeaderProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  extra?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  icon,
  title,
  description,
  extra,
  className,
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden group",
        "bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl",
        "border border-gray-200/50 dark:border-white/5",
        "shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)]",
        "rounded-[24px] p-4 md:p-5 mb-6",
        className
      )}
    >
      {/* Background Decorative Glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 dark:bg-blue-400/5 blur-[80px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-400/5 blur-[80px] rounded-full pointer-events-none" />

      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 md:gap-5">
          {/* Icon Container with Gradient Glow */}
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-400/20 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className={cn(
              "relative z-10 p-3",
              "bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700",
              "text-white shadow-lg shadow-blue-500/20",
              "rounded-2xl transform group-hover:scale-105 transition-transform duration-500"
            )}>
              {React.isValidElement(icon) 
                ? React.cloneElement(icon as React.ReactElement, { size: 22, strokeWidth: 2.5 })
                : icon
              }
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            <h1 className="text-lg md:text-xl font-black tracking-tight text-gray-900 dark:text-white">
              {title}
            </h1>
            {description && (
              <p className="text-[13px] md:text-sm text-gray-500 dark:text-gray-400 font-medium max-w-2xl leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        {extra && (
          <div className="relative flex items-center gap-3 self-end md:self-center">
            {extra}
          </div>
        )}
      </div>
    </motion.div>
  );
}
