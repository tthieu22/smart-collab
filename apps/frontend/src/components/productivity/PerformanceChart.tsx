'use client';

import { motion } from 'framer-motion';
import { Card } from '@smart/components/ui/card';
import { cn } from '@smart/lib/utils';
import { Calendar } from 'lucide-react';

interface PerformanceChartProps {
    dailyStats: Array<{ date: string; completed: number; created: number }>;
    target: number;
    isTeamMode: boolean;
}

export function PerformanceChart({ dailyStats, target, isTeamMode }: PerformanceChartProps) {
    const maxVal = Math.max(...dailyStats.map(d => Math.max(d.completed, d.created)), 1);

    return (
        <Card className="p-10 h-full border-gray-100 dark:border-neutral-800 shadow-xl shadow-black/5 relative overflow-hidden font-sans">
            <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-2">
                    <Calendar className="text-blue-500" size={18} />
                    <h3 className="font-black text-lg tracking-tight">Biểu đồ Hiệu suất</h3>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        <span className="text-[10px] font-black text-gray-400">Hoàn thành</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-gray-300 dark:bg-neutral-700" />
                        <span className="text-[10px] font-black text-gray-400">Nhiệm vụ mới</span>
                    </div>
                </div>
            </div>

            <div className="h-72 flex items-end justify-between gap-4 md:gap-8 relative select-none">
                {[0, 1, 2, 3].map((_, i) => (
                    <div key={i} className="absolute left-0 right-0 border-t border-gray-100 dark:border-neutral-900" style={{ bottom: `${(i + 1) * 25}%` }} />
                ))}

                {dailyStats.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs font-bold italic">
                        Chưa có đủ dữ liệu để phân tích tuần này...
                    </div>
                ) : dailyStats.map((day, idx) => {
                    const completedHeight = (day.completed / maxVal) * 100;
                    const createdHeight = (day.created / maxVal) * 100;

                    return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-5 group relative z-10">
                            <div className="w-full flex items-end justify-center h-full gap-1">
                                {/* Created Task Bar (Background/Input) */}
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${createdHeight}%` }}
                                    className="w-2 md:w-3 bg-gray-200 dark:bg-neutral-800 rounded-t-sm"
                                />

                                {/* Completed Task Bar (Highlight/Output) */}
                                <div className="relative flex flex-col items-center flex-1 max-w-[40px]">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${completedHeight}%` }}
                                        transition={{ delay: idx * 0.05, duration: 0.8, ease: "easeOut" }}
                                        className={cn(
                                            "w-full rounded-t-md relative transition-all duration-300 group-hover:brightness-110",
                                            isTeamMode
                                                ? "bg-gradient-to-t from-blue-600 to-indigo-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                                                : "bg-gradient-to-t from-emerald-600 to-teal-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                        )}
                                    >
                                        {day.completed > 0 && (
                                            <div className="absolute -top-8 left-1/2 -track-x-1/2 bg-neutral-900 text-white text-[9px] font-black px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-all">
                                                {day.completed}
                                            </div>
                                        )}
                                    </motion.div>
                                </div>
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{day.date}</span>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
