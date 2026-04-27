'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { UserPlus, UserCheck, Sparkles, MapPin, Building2, Activity, Heart } from 'lucide-react';
import { Button, Tag, App } from 'antd';
import { cn } from '@smart/lib/utils';
import { userService } from '@smart/services/user.service';

interface DiscoveryCardProps {
    user: any;
    gridCols?: 1 | 2 | 3;
}

export default function DiscoveryCard({ user, gridCols = 3 }: DiscoveryCardProps) {
    const { message } = App.useApp();
    const isList = gridCols === 1;
    const [isFollowing, setIsFollowing] = useState(user.isFollowing || false);
    const [loading, setLoading] = useState(false);

    const handleToggleFollow = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            setLoading(true);
            const res = await userService.toggleFollow(user.id);
            if (res.followed !== undefined) {
                setIsFollowing(res.followed);
                message.success(res.followed ? `Đã theo dõi ${user.name}` : `Đã bỏ theo dõi ${user.name}`);
            }
        } catch (err) {
            message.error('Không thể thực hiện hành động này');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={cn(
            "group relative flex overflow-hidden rounded-[24px] border border-gray-100 bg-white shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl dark:border-neutral-800 dark:bg-neutral-900 isolation-auto z-0",
            isList ? "flex-row h-56" : "flex-col"
        )}>
            {/* Background Accent */}
            <div className={cn(
                "absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10",
                isList ? "top-2 right-2" : ""
            )}>
                <Sparkles className="text-blue-500/20" size={isList ? 32 : 40} />
            </div>

            {/* Profile Section */}
            <div className={cn(
                "relative flex items-center justify-center bg-gray-50/50 dark:bg-neutral-800/20",
                isList ? "w-1/4 h-full shrink-0 border-r border-gray-50 dark:border-neutral-800/50" : "h-32 w-full border-b border-gray-50 dark:border-neutral-800/50"
            )}>
                <div className={cn(
                    "relative z-10",
                    isList ? "scale-110" : "mt-8"
                )}>
                    <div className={cn(
                        "rounded-[20px] overflow-hidden ring-4 ring-white dark:ring-neutral-800 shadow-xl transition-transform duration-500 group-hover:scale-110 bg-white dark:bg-neutral-800",
                        isList ? "h-24 w-24" : "h-20 w-20"
                    )}>
                        {user.avatar ? (
                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="h-full w-full object-cover rounded-[20px]"
                                style={{ imageRendering: 'auto' }}
                            />
                        ) : (
                            <div className="h-full w-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white">
                                {user.name?.charAt(0)}
                            </div>
                        )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-white dark:border-neutral-900 rounded-full shadow-sm" />
                </div>
            </div>

            {/* Info Section */}
            <div className={cn(
                "flex flex-1 flex-col justify-between",
                isList ? "p-6" : "p-5 pt-10"
            )}>
                <div>
                    <div className="flex justify-between items-start mb-1">
                        <div>
                            <Link href={`/profile/${user.id}`} className="block text-lg font-bold text-gray-900 dark:text-white hover:text-blue-500 transition-colors truncate max-w-[200px]">
                                {user.name}
                            </Link>
                            <p className="text-[11px] font-bold text-gray-400 dark:text-neutral-500">
                                @{user.username}
                            </p>
                        </div>
                        {isList && (
                            <div className="flex gap-2">
                                <Tag className="m-0 rounded-lg bg-green-50 dark:bg-green-900/20 border-none text-[10px] font-bold uppercase text-green-500 px-2 flex items-center gap-1">
                                    <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                                    Online
                                </Tag>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 py-2">
                        <Tag className="m-0 px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border-none text-[10px] font-bold uppercase text-blue-500">
                            Cộng tác viên
                        </Tag>
                    </div>

                    <p className={cn(
                        "text-gray-500 dark:text-neutral-400 font-medium leading-relaxed italic",
                        isList ? "text-sm line-clamp-3 my-2" : "text-[11px] line-clamp-2 mt-1"
                    )}>
                        {user.bio || "Thành viên đầy triển vọng của cộng đồng SmartCollab."}
                    </p>
                </div>

                <div className={cn(
                    "flex items-center justify-between mt-4 pt-4 border-t border-gray-50 dark:border-neutral-800/50",
                    !isList && "gap-3"
                )}>
                    <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-900 dark:text-white leading-none">{user._count?.followers || 0}</span>
                            <span className="text-[8px] font-bold text-gray-400 uppercase">Followers</span>
                        </div>
                        <div className="w-px h-4 bg-gray-100 dark:bg-neutral-800" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-900 dark:text-white leading-none">{user._count?.following || 0}</span>
                            <span className="text-[8px] font-bold text-gray-400 uppercase">Following</span>
                        </div>
                    </div>

                    <Button
                        type={isFollowing ? "default" : "primary"}
                        loading={loading}
                        onClick={handleToggleFollow}
                        icon={isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
                        className={cn(
                            "rounded-xl border-none shadow-md flex items-center justify-center gap-2 font-bold uppercase text-[10px] transition-all",
                            isFollowing
                                ? "bg-gray-100 dark:bg-neutral-800 text-gray-500 hover:text-red-500"
                                : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20",
                            isList ? "h-9 px-6" : "h-9 flex-1"
                        )}
                    >
                        {isFollowing ? 'Đã theo dõi' : 'Theo dõi'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
