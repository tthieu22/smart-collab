'use client';

import { motion } from 'framer-motion';
import { Card } from '@smart/components/ui/card';
import { Activity, CheckCircle2, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface GoalProgressProps {
    progress: number;
    completed: number;
    target: number;
}

export function GoalProgress({ progress, completed, target }: GoalProgressProps) {
    return (
        <Card className="p-8 border-none bg-slate-900 dark:bg-neutral-900 text-white shadow-2xl shadow-blue-500/10 overflow-hidden relative group">
            <Sparkles size={100} className="absolute -right-8 -bottom-8 text-white/5 group-hover:rotate-12 transition-transform duration-700" />
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                    <Activity size={16} className="text-blue-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">Tiến độ Mục tiêu</span>
                </div>

                <div className="flex items-center justify-between mb-3 font-black">
                    <span className="text-sm">Tiến độ Tuần</span>
                    <span className="text-2xl text-blue-400">{Math.round(progress)}%</span>
                </div>

                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden mb-6">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                    />
                </div>

                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="h-5 w-5 rounded bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCircle2 size={12} className="text-blue-400" />
                        </div>
                        <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                            Bạn đã hoàn thành **{completed}** công việc trong tuần này. Trung bình **{(completed / 7).toFixed(1)}** công việc mỗi ngày.
                        </p>
                    </div>
                    <Link
                        href="/projects"
                        className="flex items-center justify-center w-full py-3 rounded-xl bg-white text-slate-900 text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg text-center"
                    >
                        Tối ưu hóa Quy trình
                    </Link>
                </div>
            </div>
        </Card>
    );
}
