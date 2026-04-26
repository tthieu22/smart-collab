'use client';

import { Board } from '@smart/types/project';
import { useBoardStore } from '@smart/store/setting';
import { projectStore } from '@smart/store/project';
import { EnvironmentOutlined, InfoCircleOutlined, UnorderedListOutlined, UserOutlined } from '@ant-design/icons';
import { Typography, Space, Empty, Drawer, List, Avatar, Button, Tooltip, Tag } from 'antd';
import { useMemo, useState } from 'react';
import CardDetailModalById from '../cardDetailModal/CardDetailModalById';
import dynamic from 'next/dynamic';

const { Text, Title } = Typography;

const MapViewInternal = dynamic(() => import('./MapViewInternal'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">Đang khởi tạo bản đồ...</div>
});

interface Props {
    board: Board;
}

export default function MapView({ board }: Props) {
    const theme = useBoardStore((s) => s.theme);
    const { cards, columns } = projectStore();
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Lấy danh sách các thẻ có địa điểm trong Project hiện tại
    const cardsWithLocation = useMemo(() => {
        return Object.values(cards).filter(
            (card) =>
                card.latitude != null &&
                card.longitude != null &&
                !isNaN(Number(card.latitude)) &&
                !isNaN(Number(card.longitude))
        );
    }, [cards]);

    if (cardsWithLocation.length === 0) {
        return (
            <div className={`flex flex-col items-center justify-center min-h-[600px] h-full w-full ${theme === 'dark' ? 'bg-[#141517]' : 'bg-gray-50'}`}>
                <div className={`p-10 rounded-3xl shadow-2xl backdrop-blur-xl ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'} border text-center w-full max-w-2xl mx-6`}>
                    <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-6 text-blue-500">
                        <EnvironmentOutlined style={{ fontSize: 40 }} />
                    </div>
                    <h2 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Chế độ xem Bản đồ</h2>
                    <p className={`mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Các thẻ có thông tin địa điểm sẽ hiển thị ngay tại đây. Hãy mở một thẻ và chọn vị trí để bắt đầu.
                    </p>
                    <Empty description={false} />
                </div>
            </div>
        );
    }

    // Calculate project center
    const center: [number, number] = useMemo(() => {
        if (cardsWithLocation.length > 0) {
            const lat = Number(cardsWithLocation[0].latitude);
            const lng = Number(cardsWithLocation[0].longitude);
            if (!isNaN(lat) && !isNaN(lng)) return [lat, lng];
        }
        return [21.0285, 105.8542];
    }, [cardsWithLocation]);

    return (
        <div className={`flex flex-col h-full w-full relative ${theme === 'dark' ? 'bg-[#141517]' : 'bg-gray-50'}`}>
            <div className="absolute inset-0 z-10">
                <MapViewInternal
                    center={center}
                    cards={cardsWithLocation}
                    theme={theme === 'system' ? 'light' : theme}
                    onCardClick={setSelectedCardId}
                />
            </div>

            {/* Info Stats & Debug */}
            <div className="absolute top-6 right-6 z-20 flex flex-col items-end gap-2">
                <div
                    onClick={() => setIsDrawerOpen(true)}
                    className={`px-4 py-2 rounded-2xl shadow-xl backdrop-blur-md border cursor-pointer hover:scale-105 active:scale-95 transition-all
                        ${theme === 'dark' ? 'bg-black/40 border-white/10 text-white hover:bg-black/60' : 'bg-white/60 border-gray-200 text-gray-800 hover:bg-white/80'}`}
                >
                    <Space>
                        <EnvironmentOutlined className="text-blue-500" />
                        <Text strong className={theme === 'dark' ? 'text-white' : ''}>
                            {cardsWithLocation.length} địa điểm
                        </Text>
                        <UnorderedListOutlined className="text-[10px] opacity-50" />
                    </Space>
                </div>

                {process.env.NODE_ENV === 'development' && (
                    <div className="text-[10px] opacity-40 bg-black/10 px-2 rounded">
                        Store: {Object.keys(cards).length} cards | Found: {cardsWithLocation.length}
                    </div>
                )}
            </div>

            <Drawer
                title={
                    <div className="py-2">
                        <Space size="middle">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <EnvironmentOutlined style={{ fontSize: 20 }} />
                            </div>
                            <div>
                                <Title level={5} className={`m-0 ${theme === 'dark' ? 'text-white' : ''}`}>Địa điểm dự án</Title>
                                <Text type="secondary" className="text-xs">Tất cả các thẻ có vị trí ({cardsWithLocation.length})</Text>
                            </div>
                        </Space>
                    </div>
                }
                placement="right"
                onClose={() => setIsDrawerOpen(false)}
                open={isDrawerOpen}
                width={380}
                styles={{
                    body: { padding: '8px' },
                    header: {
                        borderBottom: theme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid #f0f0f0',
                        padding: '16px 20px'
                    }
                }}
                className={theme === 'dark' ? 'dark-drawer' : ''}
            >
                <div className={`h-full rounded-2xl overflow-hidden flex flex-col ${theme === 'dark' ? 'bg-[#1e1f22]' : 'bg-white'}`}>
                    <div className="flex-1 overflow-y-auto px-3 py-2 custom-scrollbar">
                        <List
                            dataSource={cardsWithLocation}
                            renderItem={(card) => {
                                const priorities = [
                                    { label: 'Thấp', color: '#52c41a' },
                                    { label: 'Trung bình', color: '#1890ff' },
                                    { label: 'Cao', color: '#fa8c16' },
                                    { label: 'Khẩn cấp', color: '#f5222d' },
                                ];
                                const priority = (card.priority !== undefined && card.priority !== null) ? priorities[Number(card.priority)] : null;

                                return (
                                    <List.Item
                                        className={`p-0 cursor-pointer transition-all border-none mb-4 rounded-2xl overflow-hidden
                                            ${theme === 'dark'
                                                ? 'bg-white/5 hover:bg-white/10'
                                                : 'bg-white shadow-sm hover:shadow-xl border border-gray-100 hover:border-blue-200'}`}
                                        onClick={() => {
                                            setSelectedCardId(card.id);
                                            setIsDrawerOpen(false);
                                        }}
                                    >
                                        <div className="flex flex-col w-full">
                                            {/* Card Cover Thumbnail */}
                                            <div className={`h-24 w-full relative overflow-hidden bg-gray-200 dark:bg-neutral-800`}>
                                                {card.coverUrl ? (
                                                    <div
                                                        className="w-full h-full bg-cover bg-center"
                                                        style={{
                                                            backgroundImage: card.coverUrl.startsWith('http') ? `url(${card.coverUrl})` : 'none',
                                                            backgroundColor: !card.coverUrl.startsWith('http') ? card.coverUrl : 'transparent'
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center opacity-20">
                                                        <EnvironmentOutlined style={{ fontSize: 32 }} />
                                                    </div>
                                                )}

                                                {/* Priority Badge */}
                                                {priority && (
                                                    <div className="absolute top-3 left-3">
                                                        <Tag
                                                            color={priority.color}
                                                            className="m-0 border-none rounded-full px-3 text-[10px] font-bold shadow-lg"
                                                            style={{ color: '#fff' }}
                                                        >
                                                            {priority.label.toUpperCase()}
                                                        </Tag>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="px-5 py-4">
                                                <div className="flex justify-between items-start mb-3">
                                                    <Title level={5} className={`m-0 text-base flex-1 line-clamp-1 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                                                        {card.title}
                                                    </Title>
                                                    <button className="text-blue-500 hover:scale-110 transition-transform">
                                                        <InfoCircleOutlined style={{ fontSize: 16 }} />
                                                    </button>
                                                </div>

                                                {/* Location Chip */}
                                                <div className={`mb-4 p-3 rounded-xl flex items-start gap-2 border transition-colors
                                                    ${theme === 'dark'
                                                        ? 'bg-blue-500/10 border-blue-500/20'
                                                        : 'bg-blue-50 border-blue-100'}`}
                                                >
                                                    <EnvironmentOutlined className="text-blue-500 mt-1" />
                                                    <Text className={`text-xs font-medium leading-relaxed ${theme === 'dark' ? 'text-blue-200' : 'text-blue-700'}`}>
                                                        {card.locationName || `${Number(card.latitude).toFixed(4)}, ${Number(card.longitude).toFixed(4)}`}
                                                    </Text>
                                                </div>

                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar.Group
                                                            max={{ count: 3 }}
                                                            size="small"
                                                        >
                                                            {card.members?.map(m => (
                                                                <Tooltip title={m.userName} key={m.userId}>
                                                                    <Avatar src={m.userAvatar} icon={<UserOutlined />} className="border-2 border-white dark:border-neutral-900" />
                                                                </Tooltip>
                                                            ))}
                                                        </Avatar.Group>
                                                        {card.columnId && (
                                                            <Text type="secondary" className="text-[10px] bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded">
                                                                {columns[card.columnId]?.title}
                                                            </Text>
                                                        )}
                                                    </div>

                                                    <Button
                                                        type="link"
                                                        size="small"
                                                        className="text-[10px] font-bold p-0 flex items-center gap-1 opacity-60 hover:opacity-100"
                                                    >
                                                        XEM CHI TIẾT →
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </List.Item>
                                );
                            }}
                        />
                    </div>
                </div>
            </Drawer>

            <CardDetailModalById
                cardId={selectedCardId || ''}
                isOpen={!!selectedCardId}
                onClose={() => setSelectedCardId(null)}
            />

            <style jsx global>{`
                .dark-drawer .ant-drawer-content {
                    background-color: #1e1f22 !important;
                    color: #fff !important;
                }
                .dark-drawer .ant-drawer-header-title {
                    color: #fff !important;
                }
                .dark-drawer .ant-drawer-title {
                    color: #fff !important;
                }
                .dark-drawer .ant-drawer-close {
                    color: #fff !important;
                }
            `}</style>
        </div>
    );
}
