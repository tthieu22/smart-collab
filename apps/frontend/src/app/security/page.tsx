'use client';

import React from 'react';
import SiteLayout from '@smart/components/layouts/SiteLayout';
import { PageHeader } from '@smart/components/ui/PageHeader';
import { InfoContent, InfoSection } from '@smart/components/ui/InfoContent';
import { ShieldCheck, HardDrive, Cpu, Fingerprint } from 'lucide-react';

export default function SecurityPage() {
    return (
        <SiteLayout>
            <div className="max-w-5xl mx-auto py-8 px-4">
                <PageHeader
                    icon={<ShieldCheck />}
                    title="Trung tâm Bảo mật"
                    description="Tìm hiểu về cách chúng tôi bảo vệ dữ liệu và hạ tầng của hệ thống."
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {[
                        { icon: <HardDrive size={24} />, label: "Dữ liệu", value: "Mã hóa AES-256" },
                        { icon: <Cpu size={24} />, label: "Giám sát", value: "24/7 Real-time" },
                        { icon: <Fingerprint size={24} />, label: "Truy cập", value: "Xác thực 2FA" },
                    ].map((stat, i) => (
                        <div key={i} className="p-6 rounded-[24px] bg-white dark:bg-neutral-900 border border-gray-100 dark:border-white/5 shadow-sm text-center">
                            <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-4">
                                {stat.icon}
                            </div>
                            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">{stat.label}</div>
                            <div className="text-sm font-bold text-gray-900 dark:text-white">{stat.value}</div>
                        </div>
                    ))}
                </div>

                <InfoContent>
                    <InfoSection title="An ninh Hạ tầng">
                        <p>
                            Smart Collab chạy trên các trung tâm dữ liệu đạt tiêu chuẩn Tier 3 quốc tế với các lớp bảo mật vật lý nghiêm ngặt. Hệ thống được thiết kế theo kiến trúc Microservices để đảm bảo tính cô lập và khả năng phục hồi cao.
                        </p>
                    </InfoSection>

                    <InfoSection title="Bảo mật Ứng dụng">
                        <p>Chúng tôi áp dụng các tiêu chuẩn OWASP top 10 để phòng chống các lỗ hổng bảo mật phổ biến:</p>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                            <li>Xác thực và phân quyền dựa trên JWT.</li>
                            <li>Chống tấn công SQL Injection và XSS.</li>
                            <li>Hệ thống Firewall ứng dụng web (WAF).</li>
                            <li>Tự động sao lưu dữ liệu hàng giờ.</li>
                        </ul>
                    </InfoSection>

                    <InfoSection title="Báo cáo Lỗ hổng">
                        <p>
                            Nếu bạn phát hiện bất kỳ vấn đề bảo mật nào, vui lòng báo cáo cho chúng tôi qua chương trình <strong>Bug Bounty</strong>. Chúng tôi trân trọng và có phần thưởng cho những đóng góp giúp hệ thống an toàn hơn.
                        </p>
                    </InfoSection>
                </InfoContent>
            </div>
        </SiteLayout>
    );
}
