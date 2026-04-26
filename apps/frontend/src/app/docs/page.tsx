'use client';

import React from 'react';
import SiteLayout from '@smart/components/layouts/SiteLayout';
import { PageHeader } from '@smart/components/ui/PageHeader';
import { InfoContent, InfoSection } from '@smart/components/ui/InfoContent';
import { Book, Code, Terminal, Zap, Search, ArrowRight } from 'lucide-react';
import { Input } from 'antd';
import Link from 'next/link';

export default function DocsPage() {
    const categories = [
        { icon: <Zap />, title: 'Bắt đầu nhanh', desc: 'Hướng dẫn thiết lập cơ bản trong 5 phút.' },
        { icon: <Terminal />, title: 'CLI & Tools', desc: 'Sử dụng các công cụ dòng lệnh của chúng tôi.' },
        { icon: <Code />, title: 'API Reference', desc: 'Tài liệu chi tiết về các endpoint API.' },
    ];

    return (
        <SiteLayout>
            <div className="max-w-5xl mx-auto py-8 px-4">
                <PageHeader
                    icon={<Book />}
                    title="Tài liệu kỹ thuật"
                    description="Khám phá các hướng dẫn chi tiết và tài liệu tham khảo để làm chủ Smart Collab."
                    extra={
                        <div className="relative w-64 hidden md:block">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <Input placeholder="Tìm kiếm tài liệu..." className="pl-10 h-10 rounded-xl bg-gray-100/50 border-none ring-1 ring-gray-200 dark:ring-white/5" />
                        </div>
                    }
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {categories.map((cat, i) => (
                        <div key={i} className="group p-6 rounded-[24px] bg-white dark:bg-neutral-900 border border-gray-100 dark:border-white/5 hover:border-blue-500/50 transition-all duration-300 cursor-pointer">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                {React.cloneElement(cat.icon as React.ReactElement, { size: 22 })}
                            </div>
                            <h3 className="text-sm font-black text-gray-900 dark:text-white mb-1">{cat.title}</h3>
                            <p className="text-xs text-gray-500 font-medium leading-relaxed">{cat.desc}</p>
                        </div>
                    ))}
                </div>

                <InfoContent>
                    <InfoSection title="Tổng quan">
                        <p>
                            Smart Collab là một nền tảng cộng tác tất cả trong một, kết hợp sức mạnh của AI với các công cụ quản lý dự án truyền thống. Tài liệu này sẽ giúp bạn hiểu cách tích hợp và tối ưu hóa quy trình làm việc của mình.
                        </p>
                    </InfoSection>

                    <InfoSection title="Hướng dẫn sử dụng">
                        <p>Chọn một chủ đề để bắt đầu:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                            <Link href="/docs/guide" className="p-4 rounded-xl border border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-between group transition-colors">
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Hướng dẫn sử dụng chi tiết</span>
                                <ArrowRight size={16} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <div className="p-4 rounded-xl border border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-between group transition-colors cursor-not-allowed opacity-50">
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Ví dụ thực tế (SOON)</span>
                                <ArrowRight size={16} className="text-gray-400" />
                            </div>
                        </div>
                    </InfoSection>

                    <InfoSection title="Kiến trúc hệ thống">
                        <p>
                            Smart Collab được xây dựng trên nền tảng Microservices hiện đại:
                        </p>
                        <ul>
                            <li><strong>Frontend:</strong> Next.js, Tailwind CSS, Ant Design.</li>
                            <li><strong>Backend:</strong> NestJS (Node.js) & Spring Boot (Java).</li>
                            <li><strong>Real-time:</strong> Socket.io & Redis.</li>
                            <li><strong>AI Engine:</strong> OpenAI/Anthropic SDKs.</li>
                        </ul>
                    </InfoSection>
                </InfoContent>
            </div>
        </SiteLayout>
    );
}
