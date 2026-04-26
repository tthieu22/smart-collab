'use client';

import React from 'react';
import SiteLayout from '@smart/components/layouts/SiteLayout';
import { PageHeader } from '@smart/components/ui/PageHeader';
import { InfoContent, InfoSection } from '@smart/components/ui/InfoContent';
import { FileText, Gavel, CheckCircle, AlertCircle } from 'lucide-react';

export default function TermsPage() {
    return (
        <SiteLayout>
            <div className="max-w-5xl mx-auto py-8 px-4">
                <PageHeader
                    icon={<Gavel />}
                    title="Điều khoản sử dụng"
                    description="Chào mừng bạn đến với Smart Collab. Bằng việc sử dụng dịch vụ, bạn đồng ý với các điều khoản dưới đây."
                />

                <InfoContent>
                    <InfoSection title="1. Chấp nhận điều khoản">
                        <p>
                            Bằng cách truy cập và sử dụng dịch vụ của Smart Collab, bạn xác nhận rằng bạn đã đọc, hiểu và đồng ý bị ràng buộc bởi các điều khoản và điều kiện này. Nếu bạn không đồng ý, vui lòng ngừng sử dụng dịch vụ ngay lập tức.
                        </p>
                    </InfoSection>

                    <InfoSection title="2. Trách nhiệm người dùng">
                        <p>Bạn đồng ý sử dụng dịch vụ đúng cách và không thực hiện các hành vi sau:</p>
                        <ul className="space-y-2">
                            <li className="flex items-start gap-2">
                                <CheckCircle size={16} className="text-green-500 mt-1 shrink-0" />
                                <span>Không đăng tải nội dung vi phạm pháp luật hoặc đạo đức.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle size={16} className="text-green-500 mt-1 shrink-0" />
                                <span>Không cố gắng truy cập trái phép vào hệ thống.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle size={16} className="text-green-500 mt-1 shrink-0" />
                                <span>Tự chịu trách nhiệm về tính bảo mật của tài khoản cá nhân.</span>
                            </li>
                        </ul>
                    </InfoSection>

                    <InfoSection title="3. Quyền sở hữu trí tuệ">
                        <p>
                            Tất cả các nội dung, logo, thiết kế và mã nguồn của Smart Collab là tài sản độc quyền của chúng tôi. Bạn không được phép sao chép hoặc sử dụng khi chưa có sự đồng ý bằng văn bản.
                        </p>
                    </InfoSection>

                    <InfoSection title="4. Giới hạn trách nhiệm">
                        <p>
                            Chúng tôi cung cấp dịch vụ "như hiện có" và không cam kết rằng dịch vụ sẽ không bao giờ bị gián đoạn hoặc không có lỗi. Smart Collab không chịu trách nhiệm cho bất kỳ tổn thất dữ liệu nào do sơ suất cá nhân của người dùng.
                        </p>
                    </InfoSection>
                </InfoContent>

                <div className="mt-8 text-center text-xs text-gray-500 font-medium">
                    Mọi thắc mắc vui lòng liên hệ: support@smartcollab.dev
                </div>
            </div>
        </SiteLayout>
    );
}
