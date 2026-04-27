'use client';

import { useState, useEffect } from 'react';
import SiteLayout from '@smart/components/layouts/SiteLayout';
import { Card } from '@smart/components/ui/card';
import { Users, Search, LayoutGrid, Columns, Square } from 'lucide-react';
import { Button, Input, Tag } from 'antd';
import { useUserStore } from '@smart/store/user';
import { userService } from '@smart/services/user.service';
import { cn } from '@smart/lib/utils';
import { PremiumPagination } from '@smart/components/ui/PremiumPagination';
import { PageHeader } from '@smart/components/ui/PageHeader';
import DiscoveryCard from '@smart/components/user/DiscoveryCard';

export default function DiscoveryPage() {
    const {
        suggestedUsersData,
        setSuggestedUsersData
    } = useUserStore();

    const [items, setItems] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const limit = 12;
    const [searchTerm, setSearchTerm] = useState('');
    const [gridCols, setGridCols] = useState<1 | 2 | 3>(3);
    const [activeTab, setActiveTab] = useState('Tất cả');

    const tabs = [
        { label: 'Tất cả', value: '' },
        { label: 'Hoạt động nhất', value: 'ACTIVE' },
        { label: 'Người mới', value: 'NEW' },
        { label: 'Gần đây', value: 'RECENT' }
    ];

    const fetchData = async (p: number, type?: string) => {
        try {
            setLoading(true);
            const res = await userService.getSuggestions(p, limit, type);
            if (res.success) {
                setItems(res.data);
                setTotal(res.total);

                // Lưu vào store nếu là trang 1 và không có filter
                if (p === 1 && !type) {
                    setSuggestedUsersData({
                        items: res.data,
                        total: res.total,
                        page: res.page,
                        limit: res.limit
                    });
                }
            }
        } catch (err) {
            console.error('Error fetching suggestions:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const tabValue = tabs.find(t => t.label === activeTab)?.value;
        fetchData(page, tabValue);
    }, [page, activeTab]);

    const filteredUsers = items.filter((u: any) =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const extra = (
        <div className="flex items-center bg-gray-100 dark:bg-neutral-900 p-1 rounded-xl ring-1 ring-black/5">
            <button
                onClick={() => setGridCols(1)}
                className={`p-2 rounded-lg transition-all ${gridCols === 1 ? 'bg-white dark:bg-neutral-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600'}`}
                title="1 Column"
            >
                <Square size={18} />
            </button>
            <button
                onClick={() => setGridCols(2)}
                className={`p-2 rounded-lg transition-all ${gridCols === 2 ? 'bg-white dark:bg-neutral-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600'}`}
                title="2 Columns"
            >
                <Columns size={18} />
            </button>
            <button
                onClick={() => setGridCols(3)}
                className={`p-2 rounded-lg transition-all ${gridCols === 3 ? 'bg-white dark:bg-neutral-800 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600'}`}
                title="3 Columns"
            >
                <LayoutGrid size={18} />
            </button>
        </div>
    );

    return (
        <SiteLayout>
            <div className="mx-auto w-full max-w-5xl space-y-4 pb-10 transition-all duration-500">
                <PageHeader
                    icon={<Users className="w-5 h-5" />}
                    title="Khám phá Cộng tác viên"
                    description="Tìm kiếm và kết nối với những tài năng hàng đầu trong hệ thống SmartCollab."
                    extra={extra}
                />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Categories / Tabs */}
                    <div className="flex gap-2 py-2 overflow-x-auto no-scrollbar">
                        {tabs.map((tab) => (
                            <Tag
                                key={tab.label}
                                onClick={() => {
                                    setActiveTab(tab.label);
                                    setPage(1);
                                }}
                                className={cn(
                                    "px-5 py-2 rounded-xl border-none text-[12px] font-medium cursor-pointer transition-all",
                                    activeTab === tab.label
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                                        : "bg-white dark:bg-neutral-900 text-gray-500 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800 shadow-sm ring-1 ring-black/5"
                                )}
                            >
                                {tab.label}
                            </Tag>
                        ))}
                    </div>

                    <div className="relative group md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                        <Input
                            placeholder="Tìm theo tên..."
                            className="pl-9 pr-4 h-10 w-full rounded-2xl border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 focus:ring-2 focus:ring-blue-500/10 transition-all text-sm shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className={`min-h-[500px] ${gridCols === 1
                    ? 'space-y-4'
                    : gridCols === 2
                        ? 'grid grid-cols-1 md:grid-cols-2 gap-4'
                        : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                    }`}>

                    {loading ? (
                        [...Array(6)].map((_, i) => (
                            <div key={i} className="h-64 w-full animate-pulse rounded-[24px] bg-gray-100 dark:bg-neutral-800" />
                        ))
                    ) : filteredUsers.length > 0 ? (
                        filteredUsers.map((user) => (
                            <DiscoveryCard
                                key={user.id}
                                user={user}
                                gridCols={gridCols}
                            />
                        ))
                    ) : (
                        <div className={`py-40 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-neutral-800 rounded-[32px] bg-gray-50/30 dark:bg-neutral-900/10 ${gridCols !== 1 ? 'col-span-full' : ''}`}>
                            <Users className="w-16 h-16 text-gray-200 mb-4" />
                            <p className="text-lg font-medium text-gray-400">Không tìm thấy ai phù hợp</p>
                            <Button type="link" onClick={() => setSearchTerm('')} className="text-blue-500">Xóa tìm kiếm</Button>
                        </div>
                    )}
                </div>

                {total > limit && (
                    <div className="pt-4">
                        <PremiumPagination
                            current={page}
                            total={total}
                            pageSize={limit}
                            onChange={(p) => {
                                setPage(p);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                        />
                    </div>
                )}
            </div>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}</style>
        </SiteLayout>
    );
}
