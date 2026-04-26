import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal, Button, Input, Space, Typography, AutoComplete, Tooltip } from 'antd';
import { SearchOutlined, EnvironmentOutlined, AimOutlined } from '@ant-design/icons';
import dynamic from 'next/dynamic';
import { debounce } from 'lodash';

const { Text } = Typography;

const MapInternal = dynamic(() => import('./MapInternal'), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-400">Đang tải bản đồ...</div>
});

interface Props {
    isOpen: boolean;
    onClose: () => void;
    initialLat?: number | null;
    initialLng?: number | null;
    initialName?: string | null;
    onConfirm: (data: { locationName: string; latitude: number; longitude: number }) => void;
}

export default function MapPickerModal({ isOpen, onClose, initialLat, initialLng, initialName, onConfirm }: Props) {
    const [pos, setPos] = useState<[number, number]>([initialLat || 21.0285, initialLng || 105.8542]);
    const [locationName, setLocationName] = useState(initialName || '');
    const [searchQuery, setSearchQuery] = useState('');
    const [options, setOptions] = useState<{ value: string; label: string; lat: string; lon: string }[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isLocating, setIsLocating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setPos([initialLat || 21.0285, initialLng || 105.8542]);
            setLocationName(initialName || '');
            setSearchQuery('');
            setOptions([]);
        }
    }, [isOpen, initialLat, initialLng, initialName]);

    // Reverse Geocoding to get address from coordinates
    const fetchAddress = async (lat: number, lon: number) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const data = await response.json();
            if (data && data.display_name) {
                setLocationName(data.display_name);
            }
        } catch (error) {
            console.error('Reverse geocoding failed:', error);
        }
    };

    // Debounced search for suggestions
    const fetchSuggestions = useMemo(() =>
        debounce(async (query: string) => {
            if (!query.trim()) {
                setOptions([]);
                return;
            }
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`);
                const data = await response.json();
                const formattedOptions = data.map((item: any) => ({
                    value: item.display_name,
                    label: item.display_name,
                    lat: item.lat,
                    lon: item.lon,
                }));
                setOptions(formattedOptions);
            } catch (error) {
                console.error('Fetch suggestions failed:', error);
            }
        }, 500)
        , []);

    const onSearchChange = (value: string) => {
        setSearchQuery(value);
        fetchSuggestions(value);
    };

    const onSelect = (value: string, option: any) => {
        const { lat, lon } = option;
        const newLat = parseFloat(lat);
        const newLon = parseFloat(lon);
        setPos([newLat, newLon]);
        setLocationName(value);
        setSearchQuery(value);
    };

    const handleSearchClick = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
            const data = await response.json();
            if (data && data.length > 0) {
                const { lat, lon, display_name } = data[0];
                setPos([parseFloat(lat), parseFloat(lon)]);
                setLocationName(display_name);
            }
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleMyLocation = () => {
        if (!navigator.geolocation) {
            alert('Trình duyệt của bạn không hỗ trợ định vị.');
            return;
        }
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setPos([latitude, longitude]);
                fetchAddress(latitude, longitude);
                setIsLocating(false);
            },
            (error) => {
                console.error('Geolocation error:', error);
                setIsLocating(false);
                alert('Không thể lấy vị trí hiện tại.');
            },
            { enableHighAccuracy: true }
        );
    };

    const handleConfirm = () => {
        onConfirm({
            locationName: locationName || `Vị trí tại ${pos[0].toFixed(4)}, ${pos[1].toFixed(4)}`,
            latitude: pos[0],
            longitude: pos[1],
        });
        onClose();
    };

    return (
        <Modal
            title={
                <Space>
                    <EnvironmentOutlined style={{ color: '#ff4d4f' }} />
                    <span>Thiết lập địa điểm</span>
                </Space>
            }
            open={isOpen}
            onCancel={onClose}
            onOk={handleConfirm}
            width={850}
            okText="Xác nhận vị trí"
            cancelText="Hủy"
            styles={{ body: { padding: '16px 24px 24px 24px' } }}
        >
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                        <AutoComplete
                            className="flex-1"
                            options={options}
                            value={searchQuery}
                            onSearch={onSearchChange}
                            onSelect={onSelect}
                            dropdownMatchSelectWidth={true}
                        >
                            <Input
                                placeholder="Tìm kiếm địa chỉ hoặc vị trí..."
                                onPressEnter={handleSearchClick}
                                prefix={<SearchOutlined className="opacity-40" />}
                            />
                        </AutoComplete>
                        <Button type="primary" onClick={handleSearchClick} loading={isSearching}>Tìm kiếm</Button>
                        <Tooltip title="Vị trí của tôi">
                            <Button
                                icon={<AimOutlined />}
                                onClick={handleMyLocation}
                                loading={isLocating}
                                className="flex items-center justify-center"
                            />
                        </Tooltip>
                    </div>

                    <div className="flex flex-col gap-1">
                        <Text strong style={{ fontSize: 13 }}>Tên địa điểm hiển thị:</Text>
                        <Input
                            value={locationName}
                            onChange={(e) => setLocationName(e.target.value)}
                            placeholder="Nhập tên địa điểm (ví dụ: Công ty, Nhà riêng...)"
                        />
                    </div>
                </div>

                <div className="h-[400px] w-full rounded-xl overflow-hidden border border-gray-200 relative bg-gray-100 shadow-inner">
                    {isOpen && (
                        <MapInternal
                            center={pos}
                            onPositionChange={(newPos) => {
                                setPos(newPos);
                                fetchAddress(newPos[0], newPos[1]);
                            }}
                        />
                    )}
                </div>

                <div className="flex justify-between items-center px-1">
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Tọa độ hiện tại: <span className="font-mono">{pos[0].toFixed(6)}, {pos[1].toFixed(6)}</span>
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic' }}>
                        * Nhấp trực tiếp vào bản đồ để thay đổi vị trí
                    </Text>
                </div>
            </div>
        </Modal>
    );
}
