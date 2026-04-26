'use client';

import React from 'react';
import { Row, Col, Card, Statistic, Progress, Typography } from 'antd';
import { ThunderboltOutlined, AlertOutlined, ClockCircleOutlined, CarryOutOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface Props {
    stats: {
        percent: number;
        done: number;
        total: number;
        highPriority: number;
        overdue: number;
    };
    glassStyle: React.CSSProperties;
}

const KpiMetrics: React.FC<Props> = ({ stats, glassStyle }) => {
    return (
        <Row gutter={[24, 24]} className="mb-8">
            <Col xs={24} lg={6}>
                <div className="flex flex-col gap-6 h-full">
                    <div className="flex-1 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <Text className="text-blue-100 uppercase tracking-widest font-bold text-[10px] opacity-60">Tỉ lệ hoàn thành</Text>
                            <div className="flex items-end gap-2 my-4">
                                <span className="text-6xl font-[900] leading-none">{stats.percent}%</span>
                                <span className="text-blue-100 font-bold mb-1">XONG</span>
                            </div>
                            <Progress percent={stats.percent} showInfo={false} strokeColor="#fff" trailColor="rgba(255,255,255,0.2)" strokeWidth={10} strokeLinecap="round" />
                            <div className="mt-6 flex justify-between items-center bg-white/10 p-3 rounded-2xl">
                                <Text className="text-white text-xs font-bold">{stats.done} Thẻ hoàn tất</Text>
                                <CheckCircleOutlined className="text-blue-200" />
                            </div>
                        </div>
                        <CarryOutOutlined className="absolute -bottom-6 -right-6 text-white/5 text-[180px] rotate-12 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                </div>
            </Col>

            <Col xs={24} lg={18}>
                <Row gutter={[24, 24]} className="h-full">
                    <Col xs={24} sm={12} lg={8}>
                        <Card bordered={false} style={glassStyle} className="h-full hover:translate-y-[-4px] transition-all">
                            <div className="p-2 mb-4 w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                                <ThunderboltOutlined style={{ fontSize: 24 }} />
                            </div>
                            <Statistic title={<Text type="secondary" className="text-[10px] uppercase font-bold tracking-widest">Tổng công việc</Text>} value={stats.total} className="mb-4" />
                            <Text type="secondary" className="text-xs">Dự án hiện có {stats.total} nhiệm vụ đang được vận hành.</Text>
                        </Card>
                    </Col>
                    <Col xs={24} sm={12} lg={8}>
                        <Card bordered={false} style={glassStyle} className="h-full hover:translate-y-[-4px] transition-all">
                            <div className="p-2 mb-4 w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                                <AlertOutlined style={{ fontSize: 24 }} />
                            </div>
                            <Statistic title={<Text type="secondary" className="text-[10px] uppercase font-bold tracking-widest">Ưu tiên cao</Text>} value={stats.highPriority} className="mb-4" />
                            <Text type="secondary" className="text-xs">Cần tập trung nguồn lực vào {stats.highPriority} thẻ khẩn cấp ngay bây giờ.</Text>
                        </Card>
                    </Col>
                    <Col xs={24} sm={24} lg={8}>
                        <Card bordered={false} style={glassStyle} className="h-full hover:translate-y-[-4px] transition-all">
                            <div className="p-2 mb-4 w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                                <ClockCircleOutlined style={{ fontSize: 24 }} />
                            </div>
                            <Statistic title={<Text type="secondary" className="text-[10px] uppercase font-bold tracking-widest">Áp lực thời hạn</Text>} value={stats.overdue} className="mb-4" />
                            <Text type="secondary" className="text-xs">Có {stats.overdue} thẻ đã vượt quá giới hạn thời gian cho phép.</Text>
                        </Card>
                    </Col>
                </Row>
            </Col>
        </Row>
    );
};

export default KpiMetrics;
