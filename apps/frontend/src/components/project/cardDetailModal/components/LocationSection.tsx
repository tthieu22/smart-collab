'use client';

import React, { useState } from 'react';
import { Typography, Space, Button } from 'antd';
import { EnvironmentOutlined, EditOutlined } from '@ant-design/icons';
import { useBoardStore } from '@smart/store/setting';
import dynamic from 'next/dynamic';

const MapPickerModal = dynamic(() => import('../../map/MapPickerModal'), {
    ssr: false,
    loading: () => <div className="animate-pulse bg-gray-200 h-10 w-full rounded-lg" />
});

const { Text } = Typography;

interface Props {
    locationName?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    onChange: (data: { locationName?: string | null; latitude?: number | null; longitude?: number | null }) => void;
}

const LocationSection: React.FC<Props> = ({ locationName, latitude, longitude, onChange }) => {
    const theme = useBoardStore((s) => s.theme);
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <Space align="center" size={8}>
                    <EnvironmentOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />
                    <Text strong style={{ fontSize: 13, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Địa điểm
                    </Text>
                </Space>
                <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => setIsModalOpen(true)}
                    className="opacity-50 hover:opacity-100"
                />
            </div>

            <div
                className={`
                    flex flex-col gap-1 p-3 rounded-xl cursor-pointer group transition-all
                    ${theme === 'dark' ? 'hover:bg-white/5 border border-transparent hover:border-white/10' : 'hover:bg-black/5 border border-transparent hover:border-black/5'}
                `}
                onClick={() => setIsModalOpen(true)}
            >
                {locationName ? (
                    <>
                        <Text style={{ fontSize: 14 }} className="group-hover:text-blue-500 transition-colors">
                            {locationName}
                        </Text>
                        {(latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined) && (
                            <Text type="secondary" style={{ fontSize: 11 }}>
                                {latitude.toFixed(6)}, {longitude.toFixed(6)}
                            </Text>
                        )}
                    </>
                ) : (
                    <Text type="secondary" style={{ fontSize: 13, fontStyle: 'italic' }}>
                        Chưa thiết lập địa điểm... Nhấp để chọn trên bản đồ.
                    </Text>
                )}
            </div>

            <MapPickerModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialLat={latitude || undefined}
                initialLng={longitude || undefined}
                initialName={locationName || undefined}
                onConfirm={(data) => {
                    onChange(data);
                    setIsModalOpen(false);
                }}
            />
        </div>
    );
};

export default LocationSection;
