'use client';

import React from 'react';
import { cn } from '@smart/lib/utils';
import { motion } from 'framer-motion';

interface InfoContentProps {
    children: React.ReactNode;
    className?: string;
}

export function InfoContent({ children, className }: InfoContentProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={cn(
                "bg-white dark:bg-neutral-900",
                "border border-gray-200/50 dark:border-white/5",
                "rounded-[32px] p-8 md:p-12",
                "shadow-sm dark:shadow-[0_20px_50px_rgb(0,0,0,0.3)]",
                className
            )}
        >
            <div className="space-y-6 text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                {children}
            </div>
        </motion.div>
    );
}

export function InfoSection({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <section className="mb-12 last:mb-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <span className="w-1.5 h-6 bg-blue-600 rounded-full" />
                {title}
            </h2>
            <div className="space-y-4 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-2 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:space-y-2">
                {children}
            </div>
        </section>
    );
}
