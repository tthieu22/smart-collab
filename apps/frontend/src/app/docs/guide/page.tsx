'use client';

import React from 'react';
import SiteLayout from '@smart/components/layouts/SiteLayout';
import { PageHeader } from '@smart/components/ui/PageHeader';
import { InfoContent, InfoSection } from '@smart/components/ui/InfoContent';
import { HelpCircle, ChevronRight, PlayCircle, BookOpen } from 'lucide-react';

export default function GuidePage() {
    return (
        <SiteLayout>
            <div className="max-w-5xl mx-auto py-8 px-4">
                <PageHeader
                    icon={<HelpCircle />}
                    title="Hướng dẫn sử dụng"
                    description="Hướng dẫn từng bước để bạn bắt đầu và làm quen với các tính năng của Smart Collab."
                />

                <div className="flex gap-4 mb-8 overflow-x-auto pb-2 no-scrollbar">
                    {['Người mới', 'Quản lý dự án', 'Đội ngũ dev', 'Quản trị viên'].map((tab, i) => (
                        <button key={i} className={`whitespace-nowrap px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${i === 0 ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-white dark:bg-neutral-900 text-gray-500 hover:bg-gray-50 border border-gray-100 dark:border-white/5'}`}>
                            {tab}
                        </button>
                    ))}
                </div>

                <InfoContent>
                    <InfoSection title="Bước 1: Tạo tài khoản và Thiết lập">
                        <p>
                            Để bắt đầu, bạn cần đăng ký một tài khoản Smart Collab. Sau khi xác thực email, bạn có thể thiết lập hồ sơ cá nhân và chọn không gian làm việc.
                        </p>
                        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-500/20 text-[13px] text-blue-700 dark:text-blue-400 font-medium flex gap-3">
                            <PlayCircle className="shrink-0" size={18} />
                            <span>Mẹo: Bạn có thể sử dụng Google Auth để đăng nhập nhanh chỉ trong 2 giây.</span>
                        </div>
                    </InfoSection>

                    <InfoSection title="Bước 2: Sử dụng AI để tạo Post đầu tiên">
                        <p>
                            Smart Collab cho phép bạn tạo nội dung thông minh bằng AI. Bạn chỉ cần nhập ý tưởng sơ khai, AI sẽ giúp bạn mở rộng thành bài viết hoàn chỉnh.
                        </p>
                        <ol>
                            <li>Truy cập vào <strong>Trung tâm AI</strong>.</li>
                            <li>Chọn <strong>AI Write</strong>.</li>
                            <li>Nhập từ khóa và bấm <strong>Generate</strong>.</li>
                        </ol>
                    </InfoSection>

                    <InfoSection title="Bước 3: Quản lý Dự án">
                        <p>
                            Hệ thống Kanban của chúng tôi giúp bạn theo dõi tiến độ công việc một cách trực quan. Bạn có thể kéo thả các task và phân quyền cho thành viên.
                        </p>
                    </InfoSection>

                    <div className="mt-10 p-8 rounded-[32px] bg-gray-50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/10 flex flex-col items-center text-center">
                        <BookOpen size={40} className="text-gray-400 mb-4" />
                        <h3 className="text-base font-black text-gray-900 dark:text-white mb-2">Vẫn còn thắc mắc?</h3>
                        <p className="text-sm text-gray-500 font-medium mb-6">Đừng ngần ngại liên hệ với đội ngũ hỗ trợ của chúng tôi.</p>
                        <button className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform">
                            Gửi yêu cầu hỗ trợ
                        </button>
                    </div>
                </InfoContent>
            </div>
        </SiteLayout>
    );
}
