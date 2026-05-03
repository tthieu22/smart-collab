'use client';

import React from 'react';
import SiteLayout from '@smart/components/layouts/SiteLayout';
import { PageHeader } from '@smart/components/ui/PageHeader';
import { InfoContent } from '@smart/components/ui/InfoContent';
import { Activity, Server, Database, Globe, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function StatusPage() {
    const services = [
        { name: 'API Gateway & Realtime', status: 'operational', uptime: '99.98%', note: 'Unified Gateway on Port 8000' },
        { name: 'Authentication Service', status: 'operational', uptime: '100%' },
        { name: 'Project & AI Service', status: 'operational', uptime: '99.95%', note: 'Handling Core & AI tasks' },
        { name: 'Home Social Service', status: 'operational', uptime: '99.99%', note: 'Java Backend' },
    ];

    return (
        <SiteLayout>
            <div className="max-w-5xl mx-auto py-8 px-4">
                <PageHeader
                    icon={<Activity />}
                    title="Trạng thái Hệ thống"
                    description="Theo dõi thời gian thực sự hoạt động của các dịch vụ Smart Collab."
                    extra={
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 rounded-full text-xs font-black uppercase tracking-widest border border-green-500/20">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            All Systems Normal
                        </div>
                    }
                />

                <div className="grid grid-cols-1 gap-4 mb-8">
                    {services.map((service, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-900 border border-gray-100 dark:border-white/5 rounded-2xl p-5 flex items-center justify-between group hover:border-blue-500/30 transition-all duration-300">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-500 group-hover:text-blue-500 transition-colors">
                                    <Server size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">{service.name}</h3>
                                    {service.note && <p className="text-[11px] text-amber-500 font-medium">{service.note}</p>}
                                </div>
                            </div>

                            <div className="flex items-center gap-8">
                                <div className="hidden sm:block text-right">
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Uptime</div>
                                    <div className="text-xs font-bold text-gray-600 dark:text-gray-300">{service.uptime}</div>
                                </div>
                                <div className="flex items-center gap-2 min-w-[120px] justify-end">
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${service.status === 'operational' ? 'text-green-500' : 'text-amber-500'}`}>
                                        {service.status}
                                    </span>
                                    {service.status === 'operational' ? <CheckCircle2 size={16} className="text-green-500" /> : <AlertTriangle size={16} className="text-amber-500" />}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <InfoContent>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-widest">Lịch sử Sự cố</h3>
                    <div className="space-y-6">
                        {[
                            { date: '24 Tháng 4, 2026', title: 'Bảo trì định kỳ hệ thống cơ sở dữ liệu', status: 'Completed' },
                            { date: '15 Tháng 4, 2026', title: 'Gián đoạn nhẹ dịch vụ AI do cập nhật Model', status: 'Resolved' },
                        ].map((event, i) => (
                            <div key={i} className="relative pl-6 pb-6 border-l border-gray-100 dark:border-white/5 last:pb-0">
                                <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full bg-blue-500" />
                                <div className="text-[11px] font-bold text-gray-400 mb-1">{event.date}</div>
                                <div className="text-sm font-bold text-gray-900 dark:text-white mb-1">{event.title}</div>
                                <div className="text-xs text-green-500 font-medium">{event.status}</div>
                            </div>
                        ))}
                    </div>
                </InfoContent>
            </div>
        </SiteLayout>
    );
}
