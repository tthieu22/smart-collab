'use client';

import { Sparkles, Edit, UserCheck, UserPlus, Settings, MessageSquare, MoreHorizontal, Calendar } from 'lucide-react';
import { Button } from '@smart/components/ui/button';
import { Card } from '@smart/components/ui/card';
import { Image, Tag, Tooltip, Skeleton } from 'antd';
import UserAvatar from '@smart/components/ui/UserAvatar';
import dayjs from 'dayjs';
import { cn } from '@smart/lib/utils';

interface ProfileHeaderProps {
    profileUser: any;
    targetUserId: string;
    isMe: boolean;
    profileData: any;
    currentUserId: string;
    handleFollow: () => void;
    setIsEditModalOpen: (open: boolean) => void;
    loading: boolean;
}

export default function ProfileHeader({
    profileUser,
    targetUserId,
    isMe,
    profileData,
    currentUserId,
    handleFollow,
    setIsEditModalOpen,
    loading
}: ProfileHeaderProps) {
    if (!profileUser) return null;

    return (
        <Card
            padding="none"
            className="overflow-hidden border border-gray-200 dark:border-neutral-800 shadow-sm bg-white/60 dark:bg-neutral-950/30 backdrop-blur-xl rounded-[24px] ring-1 ring-black/5 dark:ring-white/5"
        >
            {/* Cover Photo */}
            <div className="relative group h-40 md:h-64 overflow-hidden">
                <Image
                    src={profileUser.coverImage || "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop"}
                    alt="Cover"
                    className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110"
                    preview={{
                        mask: <div className="flex items-center justify-center gap-2 text-white text-[10px] font-black backdrop-blur-md bg-black/30 w-full h-full uppercase tracking-widest"><Sparkles size={14} /> Xem ảnh bìa</div>
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-50" />
            </div>

            {/* Profile Info Area */}
            <div className="px-5 pb-5 relative">
                <div className="flex flex-col md:flex-row md:items-end gap-5 -mt-12 md:-mt-16">
                    {/* Avatar with Circular Shape */}
                    <div className="relative group shrink-0">
                        <div className="p-1 bg-white dark:bg-neutral-900 rounded-full shadow-2xl relative ring-4 ring-white/10">
                            <UserAvatar
                                userId={targetUserId}
                                size="2xl"
                                allowChangeMood={isMe}
                                previewable={true}
                                className="!h-28 !w-28 md:!h-36 md:!w-36 !rounded-full transition-transform duration-500 group-hover:scale-[1.02]"
                            />
                        </div>
                    </div>

                    {/* Name & Basic Info */}
                    <div className="flex-1 min-w-0 mb-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="text-xl md:text-2xl font-black truncate tracking-tighter text-gray-900 dark:text-gray-100">
                                {profileUser.name}
                            </h1>
                            {profileData?.friends?.some((u: any) => u.id === currentUserId) && (
                                <Tag className="m-0 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-lg px-2 py-0 font-black text-[9px] uppercase tracking-wider">
                                    Friend
                                </Tag>
                            )}
                            {profileUser.verified && (
                                <span className="text-blue-500" title="Đã xác thực">
                                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                                </span>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="text-blue-500 font-bold text-sm mt-0.5 leading-none">@{profileUser.username}</p>
                            {profileUser.email ? (
                                <>
                                    <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-neutral-700" />
                                    <p className="text-gray-400 font-medium text-[11px] mt-0.5 leading-none">{profileUser.email}</p>
                                </>
                            ) : (
                                <Skeleton active={false} loading={loading} paragraph={{ rows: 1, width: 100 }} title={false}>
                                    {/* Fallback displayed if email is genuinely missing or hidden */}
                                </Skeleton>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-[10px] text-gray-500 dark:text-neutral-500 font-black uppercase tracking-widest">
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100/50 dark:bg-neutral-900/50 rounded-lg border border-gray-100 dark:border-neutral-800">
                                <Calendar size={12} className="text-blue-500" />
                                <span>Gia nhập {profileUser.createdAt ? dayjs(profileUser.createdAt).format('DD/MM/YYYY') : '...'}</span>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                    <span className="font-black text-gray-900 dark:text-gray-100">{profileData?.followersCount || 0}</span>
                                    <span className="opacity-60 tracking-[0.2em] text-[9px]">Phi Hành Đoàn</span>
                                </div>
                                <div className="w-px h-3 bg-gray-200 dark:bg-neutral-800" />
                                <div className="flex items-center gap-1.5">
                                    <span className="font-black text-gray-900 dark:text-gray-100">{profileData?.followingCount || 0}</span>
                                    <span className="opacity-60 tracking-[0.2em] text-[9px]">Đang Kết Nối</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 mb-2">
                        {isMe ? (
                            <>
                                <Button
                                    variant="primary"
                                    className="rounded-xl px-5 h-9 font-black flex items-center gap-2 shadow-sm active:scale-95 transition-all text-[10px] uppercase tracking-widest bg-blue-600 border-none hover:bg-blue-700"
                                    onClick={() => setIsEditModalOpen(true)}
                                >
                                    <Edit size={14} />
                                    <span>Cấu hình hồ sơ</span>
                                </Button>
                                <Button variant="secondary" className="h-9 w-9 p-0 rounded-xl bg-gray-100/50 dark:bg-neutral-900 border-none ring-1 ring-black/5 dark:ring-white/5">
                                    <Settings size={16} className="text-gray-500" />
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant={profileData.isFollowing ? "secondary" : "primary"}
                                    className={cn(
                                        "rounded-xl px-5 h-9 font-black flex items-center gap-2 shadow-sm transition-all text-[10px] uppercase tracking-widest active:scale-95 border-none",
                                        profileData.isFollowing ? "bg-gray-100/80 dark:bg-neutral-900 text-gray-600 dark:text-gray-300" : "bg-blue-600 text-white"
                                    )}
                                    onClick={handleFollow}
                                    loading={loading}
                                >
                                    {profileData.isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
                                    <span>{profileData.isFollowing ? 'Huỷ' : 'Gia nhập đoàn'}</span>
                                </Button>
                                <Tooltip title="Message">
                                    <Button variant="secondary" className="rounded-xl h-9 w-9 flex items-center justify-center p-0 bg-gray-100/80 dark:bg-neutral-900 border-none ring-1 ring-black/5 dark:ring-white/5">
                                        <MessageSquare size={16} className="text-gray-500" />
                                    </Button>
                                </Tooltip>
                                <Button variant="secondary" className="rounded-xl h-9 w-9 flex items-center justify-center p-0 bg-gray-100/80 dark:bg-neutral-900 border-none ring-1 ring-black/5">
                                    <MoreHorizontal size={16} className="text-gray-500" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}
