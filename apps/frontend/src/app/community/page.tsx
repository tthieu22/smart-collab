'use client';

import React from 'react';
import SiteLayout from '@smart/components/layouts/SiteLayout';
import { PageHeader } from '@smart/components/ui/PageHeader';
import { Button } from '@smart/components/ui/button';
import { Users, Github, Slack, MessageSquare, Heart, Award } from 'lucide-react';

export default function CommunityPage() {
    const channels = [
        { icon: <Github />, name: 'GitHub Discussions', desc: 'Đóng góp mã nguồn và báo cáo lỗi.', color: 'gray' },
        { icon: <Slack />, name: 'Slack Workspace', desc: 'Trò chuyện thời gian thực với đội ngũ dev.', color: 'purple' },
        { icon: <MessageSquare />, name: 'Forum', desc: 'Nơi thảo luận về các tính năng mới.', color: 'blue' },
    ];

    return (
        <SiteLayout>
            <div className="max-w-5xl mx-auto py-8 px-4">
                <PageHeader
                    icon={<Users />}
                    title="Cộng đồng Smart Collab"
                    description="Kết nối với hàng nghìn chuyên gia và nhà phát triển đang sử dụng Smart Collab trên toàn thế giới."
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {channels.map((ch, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-white/5 rounded-[32px] p-8 flex flex-col items-center text-center group hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500">
                            <div className={`w-16 h-16 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                                {React.cloneElement(ch.icon as React.ReactElement, { size: 28, className: "text-blue-600" })}
                            </div>
                            <h3 className="text-base font-black text-gray-900 dark:text-white mb-2">{ch.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">{ch.desc}</p>
                            <Button variant="secondary" className="w-full rounded-2xl">Tham gia ngay</Button>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[32px] p-10 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-125 transition-transform duration-700">
                            <Heart size={120} fill="white" />
                        </div>
                        <h2 className="text-2xl font-black mb-4">Trở thành Contributors</h2>
                        <p className="text-blue-100 mb-8 max-w-md font-medium leading-relaxed">
                            Dự án của chúng tôi phát triển nhờ sự đóng góp của cộng đồng. Bạn có thể giúp viết tài liệu, fix bug hoặc đề xuất tính năng.
                        </p>
                        <Button className="bg-white text-blue-600 hover:bg-blue-50 border-none font-bold px-8 rounded-2xl">
                            Tìm hiểu thêm
                        </Button>
                    </div>

                    <div className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-white/5 rounded-[32px] p-10 flex flex-col justify-center">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl">
                                <Award size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-gray-900 dark:text-white">Chương trình Ambassador</h3>
                                <p className="text-sm text-gray-500 font-medium">Lan tỏa Smart Collab và nhận quà tặng đặc biệt.</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <p className="text-[13px] text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                                Chúng tôi luôn tìm kiếm những người đam mê công nghệ để trở thành đại diện cho Smart Collab tại khu vực hoặc tổ chức của bạn.
                            </p>
                            <Button variant="ghost" className="p-0 hover:bg-transparent h-auto text-blue-600 font-bold flex items-center gap-2">
                                Đăng ký ngay <Github size={16} />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </SiteLayout>
    );
}
