'use client';

import { Card } from '@smart/components/ui/card';
import { Sparkles, Edit, MapPin, Globe, Cake, Mail, LayoutGrid } from 'lucide-react';
import { Image, Button } from 'antd';
import dayjs from 'dayjs';

interface ProfileSidebarProps {
    profileUser: any;
    isMe: boolean;
    userMedia: any[];
    setIsEditModalOpen: (open: boolean) => void;
    setIsGalleryModalOpen: (open: boolean) => void;
}

export default function ProfileSidebar({
    profileUser,
    isMe,
    userMedia,
    setIsEditModalOpen,
    setIsGalleryModalOpen
}: ProfileSidebarProps) {
    if (!profileUser) return null;

    const hasInfo = !!(profileUser.bio || profileUser.location || profileUser.website || profileUser.birthday || profileUser.email);

    return (
        <div className="space-y-6">
            {/* About Card */}
            {hasInfo && (
                <Card
                    padding="none"
                    className="rounded-[24px] overflow-hidden border border-gray-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-950/30 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/5 shadow-sm group"
                >
                    <div className="p-3.5 border-b border-gray-100 dark:border-neutral-800/50 flex items-center justify-between bg-gray-50/50 dark:bg-neutral-900/20">
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                <Sparkles size={14} className="text-blue-500" />
                            </div>
                            <span className="text-[10px] font-black tracking-[0.2em] text-gray-800 dark:text-gray-100 uppercase">Giới thiệu</span>
                        </div>
                        {isMe && <Edit size={12} className="text-gray-400 group-hover:text-blue-500 cursor-pointer transition-colors" onClick={() => setIsEditModalOpen(true)} />}
                    </div>

                    <div className="p-4 space-y-5">
                        {profileUser.bio && (
                            <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap font-medium pb-4 border-b border-gray-50 dark:border-neutral-800/50">
                                {profileUser.bio}
                            </p>
                        )}

                        <div className="space-y-3.5">
                            {profileUser.location && (
                                <div className="flex items-center gap-3 text-[11px] text-gray-600 dark:text-neutral-400 group/item">
                                    <div className="h-7 w-7 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg flex items-center justify-center text-blue-500 transition-all group-hover/item:scale-105 shrink-0 ring-1 ring-blue-500/10">
                                        <MapPin size={14} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-gray-900 dark:text-gray-100 truncate">{profileUser.location}</p>
                                    </div>
                                </div>
                            )}
                            {profileUser.website && (
                                <div className="flex items-center gap-3 text-[11px] text-gray-600 dark:text-neutral-400 group/item">
                                    <div className="h-7 w-7 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-lg flex items-center justify-center text-indigo-500 transition-all group-hover/item:scale-105 shrink-0 ring-1 ring-indigo-500/10">
                                        <Globe size={14} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <a href={profileUser.website.startsWith('http') ? profileUser.website : `https://${profileUser.website}`} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 hover:underline truncate block">
                                            {profileUser.website.replace(/^https?:\/\//, '')}
                                        </a>
                                    </div>
                                </div>
                            )}
                            {profileUser.birthday && (
                                <div className="flex items-center gap-3 text-[11px] text-gray-600 dark:text-neutral-400 group/item">
                                    <div className="h-7 w-7 bg-pink-50/50 dark:bg-pink-900/10 rounded-lg flex items-center justify-center text-pink-500 transition-all group-hover/item:scale-105 shrink-0 ring-1 ring-pink-500/10">
                                        <Cake size={14} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-gray-100">{dayjs(profileUser.birthday).format('DD/MM/YYYY')}</p>
                                    </div>
                                </div>
                            )}
                            {profileUser.email && (
                                <div className="flex items-center gap-3 text-[11px] text-gray-600 dark:text-neutral-400 group/item">
                                    <div className="h-7 w-7 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg flex items-center justify-center text-emerald-500 transition-all group-hover/item:scale-105 shrink-0 ring-1 ring-emerald-500/10">
                                        <Mail size={14} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-gray-900 dark:text-gray-100 truncate">{profileUser.email}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            )}

            {/* Gallery Card */}
            <Card
                padding="none"
                className="rounded-[24px] overflow-hidden border border-gray-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-950/30 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/5 shadow-sm"
            >
                <div className="p-3.5 border-b border-gray-100 dark:border-neutral-800/50 flex items-center justify-between bg-gray-50/50 dark:bg-neutral-900/20">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                            <LayoutGrid size={14} className="text-indigo-500" />
                        </div>
                        <span className="text-[10px] font-black tracking-[0.2em] text-gray-800 dark:text-gray-100 uppercase">Khoảnh khắc</span>
                    </div>
                    {userMedia.length > 0 && (
                        <button
                            onClick={() => setIsGalleryModalOpen(true)}
                            className="text-[9px] font-black text-blue-500 hover:text-blue-600 transition-colors uppercase tracking-widest"
                        >
                            Tất cả
                        </button>
                    )}
                </div>

                <div className="p-3.5">
                    {userMedia.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                            <Image.PreviewGroup>
                                {userMedia.slice(0, 9).map((m, i) => (
                                    <div key={m.id || i} className="aspect-square bg-gray-100 dark:bg-neutral-950/20 overflow-hidden relative group rounded-xl border border-white/10">
                                        <Image
                                            src={m.url}
                                            alt={m.alt || "Gallery"}
                                            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 cursor-pointer"
                                            preview={{ mask: null }}
                                        />
                                    </div>
                                ))}
                            </Image.PreviewGroup>
                        </div>
                    ) : (
                        <div className="py-8 text-center bg-gray-50/30 dark:bg-neutral-950/10 rounded-xl border border-dashed border-gray-100 dark:border-neutral-800/50">
                            <p className="text-[10px] text-gray-400 italic">Chưa có khoảnh khắc...</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
