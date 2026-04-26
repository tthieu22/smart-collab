'use client';

import React from 'react';
import { Row, Col, Card, Progress, Typography, Tag } from 'antd';
import { LineChartOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface Props {
    stats: {
        checklistPercent: number;
        done: number;
        total: number;
        percent: number;
    };
    columns: any;
    boardColumns: string[];
    boardId: string;
    cards: any;
    glassStyle: React.CSSProperties;
    token: any;
}

const HealthAnalytics: React.FC<Props> = ({ stats, columns, boardColumns, boardId, cards, glassStyle, token }) => {
    return (
        <Card bordered={false} style={glassStyle} title={<div className="flex justify-between items-center"><span><LineChartOutlined /> Phân tích sức khỏe dự án</span> <Tag color="green" className="rounded-full px-3">ỔN ĐỊNH</Tag></div>}>
            <Row gutter={[48, 24]}>
                <Col xs={24} md={14}>
                    <div className="py-10">
                        <Row gutter={[24, 24]}>
                            <Col span={12}>
                                <div className="p-6 rounded-[24px] bg-blue-500/5 border border-blue-500/10 backdrop-blur-sm">
                                    <Text type="secondary" className="text-[10px] uppercase font-bold block mb-2">Chỉ số Checklist</Text>
                                    <Title level={3} className="m-0 dark:text-white font-[900]">{stats.checklistPercent}%</Title>
                                    <Progress percent={stats.checklistPercent} showInfo={false} strokeColor="#1890ff" className="mt-2" />
                                </div>
                            </Col>
                            <Col span={12}>
                                <div className="p-6 rounded-[24px] bg-emerald-500/5 border border-emerald-500/10 backdrop-blur-sm">
                                    <Text type="secondary" className="text-[10px] uppercase font-bold block mb-2">Tốc độ đốt việc</Text>
                                    <Title level={3} className="m-0 dark:text-white font-[900]">{(stats.done / (stats.total || 1) * 1.5).toFixed(1)}x</Title>
                                    <Text className="text-[10px] text-emerald-500 font-bold mt-2 inline-block">VẬN TỐC TỐI ƯU</Text>
                                </div>
                            </Col>
                        </Row>

                        <div className="mt-8">
                            <Text strong className="text-xs block mb-6 opacity-40 uppercase tracking-widest">Phân phối thẻ theo trạng thái</Text>
                            <div className="flex flex-col gap-6">
                                {Object.values(columns).filter((c: any) => boardColumns.includes(c.id)).map((col: any, idx) => {
                                    const count = cards ? Object.values(cards).filter((c: any) => c.columnId === col.id).length : 0;
                                    const p = stats.total > 0 ? (count / stats.total) * 100 : 0;
                                    return (
                                        <div key={idx} className="group cursor-default">
                                            <div className="flex justify-between text-[11px] mb-2">
                                                <span className="font-bold opacity-60 group-hover:opacity-100 group-hover:text-indigo-500 transition-all">{col.title}</span>
                                                <span className="font-[900]">{count} thẻ</span>
                                            </div>
                                            <Progress percent={p} showInfo={false} strokeColor={token.colorPrimary} strokeWidth={6} className="m-0" />
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </Col>
                <Col xs={24} md={10}>
                    <div className="h-full flex flex-col justify-center">
                        <Card bordered={false} className="bg-indigo-600/5 border-none rounded-[48px] p-4">
                            <div className="text-center py-8">
                                <Progress type="circle" percent={stats.percent} strokeColor={{ '0%': '#6366f1', '100%': '#a855f7' }} strokeWidth={10} size={180} />
                                <div className="mt-8">
                                    <Title level={4} className="m-0 dark:text-white font-[900]">NHỊP ĐỘ DỰ ÁN</Title>
                                    <Text type="secondary" className="text-xs font-medium">Chỉ số hoàn thiện hiện tại</Text>
                                </div>
                            </div>
                        </Card>
                    </div>
                </Col>
            </Row>
        </Card>
    );
};

export default HealthAnalytics;
