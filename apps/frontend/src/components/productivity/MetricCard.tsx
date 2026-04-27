'use client';

import { motion } from 'framer-motion';
import { Card } from '@smart/components/ui/card';
import { cn } from '@smart/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
    label: string;
    value: string | number;
    sub: string;
    icon: LucideIcon;
    color: 'blue' | 'purple' | 'orange' | 'rose' | 'amber';
    index: number;
}

export function MetricCard({ label, value, sub, icon: Icon, color, index }: MetricCardProps) {
    return (
        <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
        >
            <Card className="p-6 relative overflow-hidden group hover:scale-[1.02] transition-all duration-500 border-gray-100 dark:border-neutral-800 shadow-xl shadow-black/5">
                <div className={cn(
                    "absolute top-0 right-0 h-24 w-24 bg-gradient-to-br -mr-12 -mt-12 rounded-full opacity-5 group-hover:opacity-10 transition-opacity",
                    color === 'blue' ? "from-blue-500 to-transparent" :
                        color === 'purple' ? "from-purple-500 to-transparent" :
                            color === 'orange' ? "from-orange-500 to-transparent" :
                                color === 'rose' ? "from-rose-500 to-transparent" :
                                    "from-amber-500 to-transparent"
                )} />

                <div className="flex items-center gap-3 mb-4">
                    <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center shadow-inner",
                        color === 'blue' ? "bg-blue-500/10 text-blue-500" :
                            color === 'purple' ? "bg-purple-500/10 text-purple-500" :
                                color === 'orange' ? "bg-orange-500/10 text-orange-500" :
                                    color === 'rose' ? "bg-rose-500/10 text-rose-500" :
                                        "bg-amber-500/10 text-amber-500"
                    )}>
                        <Icon size={20} />
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{label}</span>
                </div>

                <div className="text-2xl font-black tracking-tight mb-0.5 truncate">{value}</div>
                <div className="text-[11px] font-bold text-gray-400">{sub}</div>
            </Card>
        </motion.div>
    );
}
