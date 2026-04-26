'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Typography } from 'antd';
import { ExpandOutlined } from '@ant-design/icons';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '@smart/types/project';

const { Text } = Typography;

const MapResizer = () => {
    const map = useMap();
    useEffect(() => {
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }, [map]);
    return null;
};

// Fix for Leaflet icons
const fixIcons = () => {
    if (typeof window !== 'undefined' && L) {
        const DefaultIcon = L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
        });
        L.Marker.prototype.options.icon = DefaultIcon;
    }
};

interface Props {
    center: [number, number];
    cards: Card[];
    theme: 'light' | 'dark';
    onCardClick: (cardId: string) => void;
}

const MapViewInternal: React.FC<Props> = ({ center, cards, theme, onCardClick }) => {
    useEffect(() => {
        fixIcons();
    }, []);

    return (
        <>
            <MapContainer
                center={center}
                zoom={13}
                style={{ height: '100%', width: '100%', zIndex: 1 }}
                zoomControl={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url={theme === 'dark'
                        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
                />

                <MapResizer />

                {cards.map((card) => (
                    <Marker
                        key={card.id}
                        position={[Number(card.latitude), Number(card.longitude)]}
                        eventHandlers={{
                            click: () => onCardClick(card.id),
                        }}
                    >
                        <Popup className="custom-map-popup">
                            <div
                                className="p-1 cursor-pointer min-w-[120px]"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCardClick(card.id);
                                }}
                            >
                                <Text strong style={{ display: 'block', marginBottom: 4 }}>{card.title}</Text>
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                    {card.locationName || `Tọa độ: ${Number(card.latitude).toFixed(4)}, ${Number(card.longitude).toFixed(4)}`}
                                </Text>
                                <div className="mt-2 text-blue-500 text-[10px] flex items-center gap-1">
                                    <ExpandOutlined /> Chi tiết
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            <style jsx global>{`
        .custom-map-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 4px;
          background: ${theme === 'dark' ? '#2b2d31' : '#ffffff'};
          color: ${theme === 'dark' ? '#ffffff' : '#000000'};
          border: 1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};
        }
        .custom-map-popup .leaflet-popup-tip {
          background: ${theme === 'dark' ? '#2b2d31' : '#ffffff'};
        }
      `}</style>
        </>
    );
};

export default MapViewInternal;
