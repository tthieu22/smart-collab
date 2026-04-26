'use client';

import React from 'react';
import SiteLayout from '@smart/components/layouts/SiteLayout';
import { PageHeader } from '@smart/components/ui/PageHeader';
import { InfoContent, InfoSection } from '@smart/components/ui/InfoContent';
import { ShieldAlert, Lock, Eye, FileText } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <SiteLayout>
            <div className="max-w-5xl mx-auto py-8 px-4">
                <PageHeader
                    icon={<ShieldAlert />}
                    title="Quyền riêng tư"
                    description="Chúng tôi cam kết bảo vệ thông tin cá nhân và quyền riêng tư của bạn."
                />

                <InfoContent>
                    <InfoSection title="1. Thu thập thông tin">
                        <p>
                            Smart Collab thu thập thông tin để cung cấp dịch vụ tốt hơn cho tất cả người dùng của mình. Chúng tôi thu thập thông tin theo các cách sau:
                        </p>
                        <ul>
                            <li>Thông tin bạn cung cấp cho chúng tôi (Tên, email, ảnh đại diện).</li>
                            <li>Thông tin chúng tôi nhận được từ việc bạn sử dụng dịch vụ của chúng tôi.</li>
                            <li>Thông tin thiết bị và nhật ký hệ thống.</li>
                        </ul>
                    </InfoSection>

                    <InfoSection title="2. Cách chúng tôi sử dụng thông tin">
                        <p>
                            Chúng tôi sử dụng thông tin thu thập được từ tất cả các dịch vụ của mình để cung cấp, duy trì, bảo vệ và cải trợ các dịch vụ đó, đồng thời phát triển các dịch vụ mới và bảo vệ Smart Collab cũng như người dùng của chúng tôi.
                        </p>
                    </InfoSection>

                    <InfoSection title="3. Bảo mật thông tin">
                        <p>
                            Chúng tôi nỗ lực làm việc để bảo vệ Smart Collab và người dùng của chúng tôi khỏi bị truy cập trái phép hoặc thay đổi, tiết lộ hoặc phá hủy trái phép thông tin mà chúng tôi nắm giữ.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                            {[
                                { icon: <Lock size={20} />, title: "Mã hóa dữ liệu", desc: "Dữ liệu được mã hóa chuẩn SSL/TLS." },
                                { icon: <Eye size={20} />, title: "Kiểm soát truy cập", desc: "Chỉ nhân viên có thẩm quyền mới được truy cập." }
                            ].map((item, i) => (
                                <div key={i} className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex gap-4">
                                    <div className="text-blue-600">{item.icon}</div>
                                    <div>
                                        <h4 className="text-sm font-bold">{item.title}</h4>
                                        <p className="text-xs text-gray-500">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </InfoSection>

                    <InfoSection title="4. Thay đổi">
                        <p>
                            Chính sách bảo mật của chúng tôi có thể thay đổi theo thời gian. Chúng tôi sẽ không giảm quyền của bạn theo Chính sách bảo mật này mà không có sự đồng ý rõ ràng của bạn.
                        </p>
                    </InfoSection>
                </InfoContent>

                <div className="mt-8 text-center text-xs text-gray-500 font-medium">
                    Cập nhật lần cuối: 26 tháng 4, 2026
                </div>
            </div>
        </SiteLayout>
    );
}
