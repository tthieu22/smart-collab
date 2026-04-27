'use client';

import { useState, useEffect } from 'react';
import SiteLayout from '@smart/components/layouts/SiteLayout';
import { Card } from '@smart/components/ui/card';
import { Users, UserPlus, Search, ArrowLeft, Loader2, Sparkles, Filter } from 'lucide-react';
import Link from 'next/link';
import { Button, Pagination, Input, Tag } from 'antd';
import { useUserStore } from '@smart/store/user';
import { userService } from '@smart/services/user.service';
import { cn } from '@smart/lib/utils';
import { useRouter } from 'next/navigation';

export default function DiscoveryPage() {
    const router = useRouter();
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

    const fetchData = async (p: number) => {
        try {
            setLoading(true);
            // Nếu là trang 1 và store đã có dữ liệu, dùng trong store trước
            if (p === 1 && suggestedUsersData && suggestedUsersData.items.length > 0) {
                setItems(suggestedUsersData.items);
                setTotal(suggestedUsersData.total);
                setLoading(false);
                return;
            }

            const res = await userService.getSuggestions(p, limit);
            if (res.success) {
                setItems(res.data);
                setTotal(res.total);
                // Lưu vào store nếu là trang 1
                if (p === 1) {
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
        fetchData(page);
    }, [page]);

    const filteredUsers = items.filter((u: any) =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <SiteLayout>
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 text-blue-500 mb-1">
                            <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                                <Sparkles size={22} className="animate-pulse" />
                            </div>
                            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white uppercase italic">
                                Khám phá Cộng tác viên
                            </h1>
                        </div>
                        <p className="text-gray-500 dark:text-neutral-400 font-medium ml-1">
                            Tìm kiếm và kết nối với những tài năng hàng đầu trong mạng lưới của bạn
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                            <Input
                                placeholder="Tìm theo tên hoặc username..."
                                className="pl-10 pr-4 h-12 w-full md:w-80 rounded-2xl border-gray-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-xl focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button className="h-12 w-12 flex items-center justify-center rounded-2xl border-gray-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50">
                            <Filter size={18} className="text-gray-500" />
                        </Button>
                    </div>
                </div>

                {/* Categories / Tags */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
                    {['Tất cả', 'Hoạt động nhất', 'Người mới', 'Gần đây', 'Chuyên gia thiết kế', 'Lập trình viên'].map((tag, i) => (
                        <Tag key={tag} className={cn(
                            "px-4 py-2 rounded-xl border-none font-bold text-xs uppercase cursor-pointer transition-all",
                            i === 0 ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "bg-white dark:bg-neutral-900 text-gray-500 dark:text-neutral-400 hover:bg-gray-50 dark:hover:bg-neutral-800"
                        )}>
                            {tag}
                        </Tag>
                    ))}
                </div>

                {/* Content Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                            <div key={i} className="h-72 rounded-[32px] bg-white/50 dark:bg-neutral-900/50 border border-gray-100 dark:border-neutral-800 animate-pulse" />
                        ))}
                    </div>
                ) : filteredUsers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredUsers.map((user) => (
                            <Card
                                key={user.id}
                                className="group relative overflow-hidden bg-white/50 dark:bg-neutral-900/30 backdrop-blur-xl border-gray-100 dark:border-neutral-800/50 rounded-[32px] p-6 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 hover:-translate-y-1"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Sparkles className="text-blue-500/20" size={40} />
                                </div>

                                <div className="flex flex-col items-center text-center space-y-4">
                                    <Link href={`/profile/${user.id}`} className="relative">
                                        <div className="h-24 w-24 rounded-[28px] overflow-hidden ring-4 ring-white dark:ring-neutral-800 shadow-xl transition-transform duration-500 group-hover:scale-110">
                                            {user.avatar ? (
                                                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-black text-white">
                                                    {user.name?.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white dark:border-neutral-900 rounded-full shadow-sm" />
                                    </Link>

                                    <div className="space-y-1">
                                        <Link href={`/profile/${user.id}`} className="block text-lg font-black text-gray-900 dark:text-white hover:text-blue-500 transition-colors tracking-tight">
                                            {user.name}
                                        </Link>
                                        <p className="text-sm font-bold text-gray-400 dark:text-neutral-500 italic">
                                            @{user.username}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap justify-center gap-1.5 py-1">
                                        <Tag className="m-0 px-2.5 py-0.5 rounded-lg bg-gray-100 dark:bg-neutral-800 border-none text-[10px] font-black uppercase text-gray-500">
                                            {user.loginCount || 0} lần hoạt động
                                        </Tag>
                                        <Tag className="m-0 px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border-none text-[10px] font-black uppercase text-blue-500">
                                            Cộng tác viên
                                        </Tag>
                                    </div>

                                    <p className="text-xs text-gray-500 dark:text-neutral-400 line-clamp-2 min-h-[32px] font-medium leading-relaxed uppercase tracking-wider italic">
                                        {user.bio || "Thành viên đầy triển vọng của cộng đồng SmartCollab."}
                                    </p>

                                    <div className="w-full pt-4">
                                        <Button
                                            type="primary"
                                            icon={<UserPlus size={16} />}
                                            className="w-full h-12 rounded-2xl bg-blue-500 hover:bg-blue-600 border-none shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs"
                                        >
                                            Kết nối ngay
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 dark:bg-neutral-900/20 rounded-[40px] border-2 border-dashed border-gray-200 dark:border-neutral-800">
                        <div className="h-20 w-20 rounded-3xl bg-white dark:bg-neutral-900 shadow-xl flex items-center justify-center mb-6">
                            <Users size={32} className="text-gray-200" />
                        </div>
                        <h3 className="text-xl font-black text-gray-800 dark:text-white uppercase mb-2 italic">Không tìm thấy ai phù hợp</h3>
                        <p className="text-gray-400 font-medium">Thử thay đổi từ khóa tìm kiếm của bạn xem sao</p>
                    </div>
                )}

                {/* Pagination */}
                {total > limit && (
                    <div className="mt-12 flex justify-center pb-20">
                        <Pagination
                            current={page}
                            total={total}
                            pageSize={limit}
                            onChange={(p) => setPage(p)}
                            className="custom-pagination"
                        />
                    </div>
                )}
            </div>

            <style jsx global>{`
        .custom-pagination .ant-pagination-item {
          border-radius: 12px;
          border: none;
          background: transparent;
          font-weight: 700;
        }
        .custom-pagination .ant-pagination-item-active {
          background: #3b82f6 !important;
        }
        .custom-pagination .ant-pagination-item-active a {
          color: white !important;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
        </SiteLayout>
    );
}
