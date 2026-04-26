'use client';

import React from 'react';
import { Card, Progress, Avatar, Typography, Space, Empty } from 'antd';
import { TeamOutlined, UserOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface Props {
    memberWorkload: any[];
    totalCards: number;
    glassStyle: React.CSSProperties;
    theme: 'light' | 'dark';
}

const MemberWorkload: React.FC<Props> = ({ memberWorkload, totalCards, glassStyle, theme }) => {
    return (
        <Card bordered={false} style={glassStyle} title={<span><TeamOutlined /> Năng lực thành viên</span>} className="h-full shadow-lg">
            <div className="flex flex-col gap-8 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {memberWorkload.length > 0 ? memberWorkload.map((m, i) => (
                    <div key={i} className="flex flex-col gap-3 group">
                        <div className="flex justify-between items-center">
                            <Space size="middle">
                                <Avatar src={m.avatar} icon={<UserOutlined />} size={48} className="bg-indigo-500 shadow-xl border-2 border-white/20" />
                                <div className="flex flex-col">
                                    <Text strong className="text-base dark:text-white leading-none mb-1 group-hover:text-indigo-500 transition-colors">{m.name}</Text>
                                    <Text className="text-[10px] opacity-40 font-bold uppercase tracking-wider">{m.count} thẻ được giao</Text>
                                </div>
                            </Space>
                            <div className="text-right">
                                <div className="text-lg font-[900] text-indigo-500 leading-none">{Math.round((m.done / m.count) * 100)}%</div>
                                <Text className="text-[10px] opacity-40 uppercase font-bold">Xong</Text>
                            </div>
                        </div>
                        <Progress
                            percent={(m.count / (totalCards || 1)) * 100}
                            success={{ percent: (m.done / (m.count || 1)) * 100 }}
                            showInfo={false}
                            strokeWidth={12}
                            strokeColor="#818cf8"
                            trailColor={theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
                            className="m-0 rounded-full overflow-hidden"
                        />
                    </div>
                )) : <Empty description="Chưa có phân bổ nhân sự" className="py-12" />}
            </div>
        </Card>
    );
};

export default MemberWorkload;
