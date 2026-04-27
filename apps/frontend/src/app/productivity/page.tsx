'use client';

import { useAnalytics } from '@smart/hooks/useAnalytics';
import { projectStore } from '@smart/store/project';
import {
    Zap,
    Users,
    ArrowLeft,
    Trophy,
    Flame,
    CheckCircle2,
    TrendingUp,
    Target,
    Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@smart/lib/utils';
import { motion } from 'framer-motion';

// Sub-components
import { MetricCard } from '@smart/components/productivity/MetricCard';
import { PerformanceChart } from '@smart/components/productivity/PerformanceChart';
import { GoalProgress } from '@smart/components/productivity/GoalProgress';

export default function ProductivityReportPage() {
    const activeProjectId = projectStore((s) => s.activeProjectId);
    const { data: stats, isLoading } = useAnalytics({ teamId: activeProjectId });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-neutral-50 dark:bg-black">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="relative h-16 w-16">
                        <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
                        <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                    </div>
                    <span className="text-sm font-bold text-gray-500 animate-pulse">Đang phân tích hiệu suất...</span>
                </motion.div>
            </div>
        );
    }

    const isTeamMode = stats?.isTeamMode;
    const progress = Math.min(((stats?.completed || 0) / (stats?.target || 1)) * 100, 100);

    const metrics = [
        {
            label: "Hiệu suất Hệ thống",
            value: (stats?.boost || 0) + "%",
            sub: stats?.trend === 'up' ? "Đang tăng" : "Đang giảm",
            icon: TrendingUp,
            color: "blue" as const
        },
        {
            label: "Tỉ lệ Thành công",
            value: stats?.completed || 0,
            sub: "Công việc đã xong",
            icon: CheckCircle2,
            color: "purple" as const
        },
        {
            label: "Mục tiêu Hiện tại",
            value: stats?.target || 0,
            sub: "Công việc trọng tâm",
            icon: Target,
            color: "orange" as const
        },
        {
            label: isTeamMode ? "Đóng góp hàng đầu" : "Chuỗi ngày (Streak)",
            value: isTeamMode ? (stats?.topPerformer?.name || "N/A") : (stats?.streak || 0) + " Ngày",
            sub: isTeamMode ? `${stats?.topPerformer?.count || 0} việc đã xong` : "Duy trì năng lượng! 🔥",
            icon: isTeamMode ? Trophy : Flame,
            color: isTeamMode ? "amber" as const : "rose" as const
        }
    ];

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-black text-neutral-900 dark:text-neutral-100 overflow-x-hidden selection:bg-blue-500 selection:text-white">
            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute top-[20%] -left-[10%] w-[30%] h-[30%] bg-purple-500/10 blur-[120px] rounded-full delay-1000 animate-pulse" />
            </div>

            <div className="max-w-6xl mx-auto px-6 py-12 relative z-10">
                {/* Navigation & Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className="flex flex-col gap-6">
                        <Link
                            href="/"
                            className="group flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-500 transition-colors bg-white dark:bg-neutral-950 px-4 py-2 rounded-full w-fit border border-gray-100 dark:border-neutral-800 shadow-sm shadow-black/5"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Quay lại Không gian làm việc
                        </Link>
                        <div>
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="flex items-center gap-3 mb-2"
                            >
                                <div className={cn(
                                    "p-2 rounded-xl flex items-center justify-center",
                                    isTeamMode ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                )}>
                                    {isTeamMode ? <Users size={20} /> : <Zap size={20} />}
                                </div>
                                <h1 className="text-4xl font-black tracking-tight leading-none bg-gradient-to-r from-neutral-900 to-neutral-500 dark:from-white dark:to-neutral-500 bg-clip-text text-transparent">
                                    {isTeamMode ? "Hiệu suất Nhóm" : "Hiệu suất Cá nhân"}
                                </h1>
                            </motion.div>
                            <p className="text-gray-500 font-medium ml-1">Phân tích năng suất chi tiết trong 7 ngày qua.</p>
                        </div>
                    </div>

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center gap-2 bg-white dark:bg-neutral-950 p-1.5 rounded-2xl border border-gray-100 dark:border-neutral-800 shadow-xl shadow-black/5"
                    >
                        <button className={cn(
                            "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                            !isTeamMode ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20 scale-105" : "text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-900"
                        )}>
                            Cá nhân
                        </button>
                        <button className={cn(
                            "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                            isTeamMode ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20 scale-105" : "text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-900"
                        )}>
                            Cộng tác
                        </button>
                    </motion.div>
                </div>

                {/* Top Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    {metrics.map((m, i) => (
                        <MetricCard key={i} {...m} index={i} />
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Chart Column */}
                    <motion.div
                        initial={{ x: -30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="lg:col-span-2"
                    >
                        <PerformanceChart
                            dailyStats={stats?.dailyStats || []}
                            target={stats?.target || 1}
                            isTeamMode={!!isTeamMode}
                        />
                    </motion.div>

                    {/* Progress and Tips */}
                    <motion.div
                        initial={{ x: 30, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="flex flex-col gap-8"
                    >
                        <GoalProgress
                            progress={progress}
                            completed={stats?.completed || 0}
                            target={stats?.target || 1}
                        />

                        {/* Motivational Quote or Status */}
                        <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10 flex flex-col items-center text-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-white dark:bg-neutral-900 border border-blue-100 dark:border-neutral-800 flex items-center justify-center shadow-sm">
                                <Sparkles size={20} className="text-blue-500" />
                            </div>
                            <h4 className="font-black text-sm tracking-tight text-blue-600 dark:text-blue-400">Gợi ý Năng suất</h4>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed italic px-2">
                                "Sự tập trung bền bỉ luôn tốt hơn những nỗ lực nhất thời. Chuỗi {stats?.streak || 0} ngày hoàn thành việc của bạn đang tạo đà rất tốt!"
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
