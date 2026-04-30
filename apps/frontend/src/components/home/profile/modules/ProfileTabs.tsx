'use client';

import { Tabs, Empty, Button as AntButton, Tag } from 'antd';
import { LayoutGrid, Info, Users, UserPlus, UserMinus } from 'lucide-react';
import { Card } from '@smart/components/ui/card';
import { Button } from '@smart/components/ui/button';
import Link from 'next/link';
import dayjs from 'dayjs';
import FeedPostCard from '@smart/components/home/feed/FeedPostCard';
import { cn } from '@smart/lib/utils';

interface ProfileTabsProps {
    activeTab: string;
    setActiveTab: (key: string) => void;
    userPosts: string[];
    profileUser: any;
    profileData: any;
    currentUserId: string;
    actionLoading: string | null;
    handleListToggleFollow: (id: string) => void;
    isMe: boolean;
}

export default function ProfileTabs({
    activeTab,
    setActiveTab,
    userPosts,
    profileUser,
    profileData,
    currentUserId,
    actionLoading,
    handleListToggleFollow,
    isMe
}: ProfileTabsProps) {
    const tabs = [
        {
            key: '1',
            label: (
                <div className="flex items-center gap-2 group">
                    <LayoutGrid size={13} />
                    <span>Bài viết</span>
                    <span className="text-[9px] bg-gray-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded-full">{userPosts.length}</span>
                </div>
            ),
        },
        {
            key: '2',
            label: (
                <div className="flex items-center gap-2 group">
                    <Info size={13} />
                    <span>Giới thiệu</span>
                </div>
            ),
        },
        {
            key: '3',
            label: (
                <div className="flex items-center gap-2 group">
                    <Users size={13} />
                    <span>Mối quan hệ</span>
                    <span className="text-[9px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full">
                        {profileData?.friends?.length || 0}
                    </span>
                </div>
            ),
        },
    ];

    const UserList = ({ items, title, emptyText }: { items: any[], title: string, emptyText: string }) => (
        <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
                <div className="h-3 w-1 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                <h4 className="font-black text-[9px] text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">{title}</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {items.map(u => {
                    const isFollowingThisUser = profileData?.following?.some((f: any) => f.id === u.id);
                    const isMeInList = u.id === currentUserId;

                    return (
                        <div key={u.id} className="group flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-neutral-900/20 border border-gray-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all ring-1 ring-black/5 dark:ring-white/5">
                            <Link href={`/profile/${u.id}`} className="shrink-0 relative">
                                <div className="w-10 h-10 rounded-xl overflow-hidden border border-gray-200 dark:border-neutral-700/50 shadow-sm transition-transform duration-500 group-hover:scale-105">
                                    {u.avatar ? (
                                        <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-xs uppercase italic">
                                            {u.name?.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white dark:border-neutral-900 rounded-full shadow-sm" />
                            </Link>
                            <div className="flex-1 min-w-0">
                                <Link href={`/profile/${u.id}`} className="block font-black text-xs text-gray-900 dark:text-gray-100 truncate hover:text-blue-500 transition-colors leading-tight">{u.name}</Link>
                                <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase tracking-wider opacity-70">@{u.username || 'user'}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                {!isMeInList && (
                                    <button
                                        disabled={actionLoading === u.id}
                                        onClick={() => handleListToggleFollow(u.id)}
                                        className={cn(
                                            "h-8 w-8 rounded-lg flex items-center justify-center transition-all ring-1",
                                            isFollowingThisUser
                                                ? "bg-gray-50 dark:bg-neutral-900 text-gray-400 ring-gray-200 dark:ring-neutral-700 hover:text-red-400"
                                                : "bg-blue-600 text-white ring-blue-500 hover:bg-blue-700 shadow-sm shadow-blue-500/20"
                                        )}
                                    >
                                        {actionLoading === u.id ? <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : (isFollowingThisUser ? <UserMinus size={12} /> : <UserPlus size={12} />)}
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
                {items.length === 0 && (
                    <div className="col-span-full py-8 text-center bg-gray-50/50 dark:bg-neutral-950/20 rounded-xl border-2 border-dashed border-gray-100 dark:border-neutral-800 shadow-inner">
                        <div className="flex flex-col items-center gap-2">
                            <Users size={20} className="text-gray-300 dark:text-neutral-700 mb-1" />
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] opacity-80">{emptyText}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="p-0 border border-gray-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-950/30 backdrop-blur-xl rounded-t-[24px] rounded-b-none mb-0 ring-1 ring-black/5 dark:ring-white/5 overflow-hidden">
                <div className="px-5">
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        items={tabs}
                        className="profile-tabs-compact"
                    />
                </div>
            </div>

            <div className="space-y-6 animate-in fade-in duration-500">
                {activeTab === '1' && (
                    <div className="space-y-4">
                        {userPosts.length ? (
                            userPosts.map((pid) => <FeedPostCard key={pid} postId={pid} />)
                        ) : (
                            <Card padding="none" className="rounded-[24px] border-2 border-dashed border-gray-200 dark:border-neutral-800 bg-white/40 dark:bg-neutral-950/20 backdrop-blur-xl p-12 text-center">
                                <div className="h-16 w-16 bg-gray-50 dark:bg-neutral-900 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-neutral-800">
                                    <LayoutGrid size={28} className="text-gray-200 dark:text-neutral-700" />
                                </div>
                                <h4 className="font-black text-gray-900 dark:text-gray-100 text-sm mb-1 uppercase tracking-[0.1em]">Khoảng lặng sáng tạo</h4>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest opacity-60">
                                    {isMe ? 'Hãy bắt đầu hành trình chia sẻ của bạn.' : 'Chưa có bài viết nào được đăng tải.'}
                                </p>
                            </Card>
                        )}
                    </div>
                )}

                {activeTab === '2' && (
                    <Card padding="none" className="rounded-[24px] border border-gray-200 dark:border-neutral-800 shadow-sm bg-white/50 dark:bg-neutral-950/30 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/5 overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-gray-100 dark:border-neutral-800/50 bg-gray-50/50 dark:bg-neutral-900/20">
                            <h3 className="font-black text-[9px] uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                                Thông tin định danh
                            </h3>
                        </div>
                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 bg-white/50 dark:bg-neutral-900/40 rounded-xl border border-gray-200 dark:border-neutral-800/50 shadow-sm transition-all hover:shadow-md hover:border-blue-500/30 group">
                                <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-2 opacity-80 group-hover:opacity-100">Full Name</p>
                                <h4 className="font-black text-xs text-gray-900 dark:text-gray-100 leading-none">{profileUser.name}</h4>
                            </div>
                            <div className="p-4 bg-white/50 dark:bg-neutral-900/40 rounded-xl border border-gray-200 dark:border-neutral-800/50 shadow-sm transition-all hover:shadow-md hover:border-purple-500/30 group">
                                <p className="text-[8px] font-black text-purple-500 uppercase tracking-widest mb-2 opacity-80 group-hover:opacity-100">Joined On</p>
                                <h4 className="font-black text-xs text-gray-900 dark:text-gray-100 leading-none">{dayjs(profileUser.createdAt).format('DD/MM/YYYY')}</h4>
                            </div>
                            {profileUser.bio && (
                                <div className="p-5 bg-white/50 dark:bg-neutral-900/40 rounded-xl border border-gray-200 dark:border-neutral-800/50 sm:col-span-2 relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 transition-all group-hover:w-2" />
                                    <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-2.5 opacity-80">Personal Signature</p>
                                    <p className="text-[11px] font-bold text-gray-600 dark:text-neutral-300 leading-relaxed italic pl-1 border-l border-gray-200 dark:border-neutral-800 ml-1">
                                        "{profileUser.bio}"
                                    </p>
                                </div>
                            )}
                        </div>
                    </Card>
                )}

                {activeTab === '3' && (
                    <div className="space-y-8 pb-4">
                        <UserList items={profileData?.friends || []} title="Bạn cùng đam mê" emptyText="Hành trình kết nối đang bắt đầu..." />
                        <UserList items={profileData?.followers || []} title="Cộng đồng hâm mộ" emptyText="Chưa có người hâm mộ nào..." />
                        <UserList items={profileData?.following || []} title="Tài năng quan tâm" emptyText="Chưa quan tâm ai..." />
                    </div>
                )}
            </div>

            <style jsx global>{`
                .profile-tabs-compact .ant-tabs-nav {
                    margin-bottom: 0 !important;
                }
                .profile-tabs-compact .ant-tabs-nav::before {
                    display: none !important;
                }
                .profile-tabs-compact .ant-tabs-tab {
                    padding: 16px 0 !important;
                    margin-right: 28px !important;
                }
                .profile-tabs-compact .ant-tabs-tab-btn {
                    font-weight: 900 !important;
                    font-size: 11px !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.18em !important;
                    color: #94a3b8 !important;
                    transition: all 0.3s ease;
                }
                .profile-tabs-compact .ant-tabs-tab-active .ant-tabs-tab-btn {
                    color: #3b82f6 !important;
                    text-shadow: 0 0 10px rgba(59,130,246,0.3);
                }
                .profile-tabs-compact .ant-tabs-ink-bar {
                    height: 3px !important;
                    background: #3b82f6 !important;
                    border-radius: 4px 4px 0 0 !important;
                    box-shadow: 0 -2px 10px rgba(59,130,246,0.5);
                }
            `}</style>
        </div>
    );
}
