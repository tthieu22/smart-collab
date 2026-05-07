'use client';

import { Sparkles, Edit, UserCheck, UserPlus, Settings, MessageSquare, MoreHorizontal, Calendar } from 'lucide-react';
import { Button } from '@smart/components/ui/button';
import { Card } from '@smart/components/ui/card';
import { Image, Tag, Tooltip } from 'antd';
import UserAvatar from '@smart/components/ui/UserAvatar';
import dayjs from 'dayjs';
import { cn } from '@smart/lib/utils';
import { UI_CONFIG } from '@smart/lib/constants';

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
            className={cn(
                "overflow-hidden transition-all duration-500",
                UI_CONFIG.CARD.BG,
                UI_CONFIG.CARD.BORDER,
                UI_CONFIG.CARD.RADIUS,
                UI_CONFIG.CARD.SHADOW
            )}
        >
            {/* Cover Photo */}
            <div className="relative group h-36 md:h-64 overflow-hidden">
                <Image
                    src={profileUser.coverImage || "https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2029&auto=format&fit=crop"}
                    alt="Cover"
                    className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-105"
                    preview={{
                        mask: <div className="flex items-center justify-center gap-2 text-white text-[10px] font-black backdrop-blur-md bg-black/30 w-full h-full uppercase tracking-widest"><Sparkles size={14} /> Xem ảnh bìa</div>
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
            </div>

            {/* Profile Info Area */}
            <div className="px-5 md:px-8 pb-6 relative">
                <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6 -mt-14 md:-mt-20">
                    {/* Avatar Container */}
                    <div className="relative group shrink-0">
                        <div className="p-1 bg-white dark:bg-neutral-950 rounded-full shadow-2xl relative ring-4 ring-white/10 dark:ring-white/5 transition-transform duration-500 group-hover:scale-105">
                            <UserAvatar
                                userId={targetUserId}
                                size="2xl"
                                allowChangeMood={isMe}
                                allowChangeAvatar={isMe}
                                isLoading={loading}
                                previewable={true}
                                className="!h-28 !w-28 md:!h-40 md:!w-40 !rounded-full"
                            />
                        </div>
                    </div>

                    {/* Name & Basic Info */}
                    <div className="flex-1 min-w-0 mb-1 text-center md:text-left">
                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-2.5">
                            <h1 className="text-xl md:text-3xl font-black truncate tracking-tighter text-gray-900 dark:text-gray-100">
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
                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 mt-1">
                            <p className="text-blue-500 font-bold text-sm leading-none">@{profileUser.username}</p>
                            {profileUser.email && (
                                <>
                                    <div className="hidden sm:block w-1 h-1 rounded-full bg-gray-300 dark:bg-neutral-700" />
                                    <p className="hidden sm:block text-gray-400 font-medium text-[11px] leading-none">{profileUser.email}</p>
                                </>
                            )}
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-4 gap-y-2 mt-4 text-[10px] text-gray-500 dark:text-neutral-500 font-black uppercase tracking-widest">
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100/50 dark:bg-neutral-900/50 rounded-lg border border-gray-100 dark:border-neutral-800">
                                <Calendar size={12} className="text-blue-500" />
                                <span>Gia nhập {profileUser.createdAt ? dayjs(profileUser.createdAt).format('MM/YYYY') : '...'}</span>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                    <span className="font-black text-gray-900 dark:text-gray-100">{profileData?.followersCount || 0}</span>
                                    <span className="opacity-60 tracking-[0.2em] text-[9px]">Followers</span>
                                </div>
                                <div className="w-px h-3 bg-gray-200 dark:bg-neutral-800" />
                                <div className="flex items-center gap-1.5">
                                    <span className="font-black text-gray-900 dark:text-gray-100">{profileData?.followingCount || 0}</span>
                                    <span className="opacity-60 tracking-[0.2em] text-[9px]">Following</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 mb-2 w-full md:w-auto justify-center md:justify-end mt-2 md:mt-0">
                        {isMe ? (
                            <>
                                <Button
                                    variant="primary"
                                    className="rounded-xl px-6 h-10 font-black flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-[10px] uppercase tracking-widest bg-blue-600 border-none hover:bg-blue-700"
                                    onClick={() => setIsEditModalOpen(true)}
                                >
                                    <Edit size={14} />
                                    <span>Cấu hình hồ sơ</span>
                                </Button>
                                <Button variant="secondary" className="h-10 w-10 p-0 rounded-xl bg-gray-100 dark:bg-neutral-900 border-none ring-1 ring-black/5 dark:ring-white/5">
                                    <Settings size={18} className="text-gray-500" />
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant={profileData.isFollowing ? "secondary" : "primary"}
                                    className={cn(
                                        "rounded-xl px-6 h-10 font-black flex items-center gap-2 shadow-sm transition-all text-[10px] uppercase tracking-widest active:scale-95 border-none",
                                        profileData.isFollowing ? "bg-gray-100 dark:bg-neutral-900 text-gray-600 dark:text-gray-300" : "bg-blue-600 text-white"
                                    )}
                                    onClick={handleFollow}
                                    loading={loading}
                                >
                                    {profileData.isFollowing ? <UserCheck size={14} /> : <UserPlus size={14} />}
                                    <span>{profileData.isFollowing ? 'Huỷ' : 'Gia nhập đoàn'}</span>
                                </Button>
                                <Tooltip title="Message">
                                    <Button variant="secondary" className="rounded-xl h-10 w-10 flex items-center justify-center p-0 bg-gray-100 dark:bg-neutral-900 border-none ring-1 ring-black/5 dark:ring-white/5">
                                        <MessageSquare size={18} className="text-gray-500" />
                                    </Button>
                                </Tooltip>
                                <Button variant="secondary" className="rounded-xl h-10 w-10 flex items-center justify-center p-0 bg-gray-100 dark:bg-neutral-900 border-none ring-1 ring-black/5">
                                    <MoreHorizontal size={18} className="text-gray-500" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}
