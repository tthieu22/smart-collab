'use client';

import React from 'react';
import { Row, Col, Typography, Button, Skeleton, Tag } from 'antd';
import { RobotOutlined, ReloadOutlined, MessageOutlined, RocketOutlined, BulbOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';

const { Title, Paragraph, Text } = Typography;

interface AiAnalysis {
    summary: string;
    insights: string[];
    recommendations: string[];
}

interface Props {
    aiAnalysis: AiAnalysis | null;
    isAiLoading: boolean;
    theme: 'light' | 'dark';
    token: any;
    onAnalyze: () => void;
    onOpenChat: () => void;
}

const AiInsightPanel: React.FC<Props> = ({ aiAnalysis, isAiLoading, theme, token, onAnalyze, onOpenChat }) => {
    if (!aiAnalysis && !isAiLoading) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 20 }}
            className="mb-10 ai-panel-container"
        >
            <div
                className="relative overflow-hidden rounded-[32px] border border-white/20 dark:border-white/5 shadow-2xl"
                style={{
                    background: theme === 'dark'
                        ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(124, 58, 237, 0.03) 100%)'
                        : 'linear-gradient(135deg, rgba(99, 102, 241, 0.03) 0%, rgba(217, 70, 239, 0.03) 100%)',
                    backdropFilter: 'blur(40px)'
                }}
            >
                <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
                    style={{ backgroundImage: `radial-gradient(${token.colorPrimary} 1px, transparent 0)`, backgroundSize: '24px 24px' }} />

                <div className="absolute top-0 right-0 p-6 flex items-center gap-2 no-print">
                    <Button
                        onClick={onOpenChat}
                        className="h-10 px-5 rounded-full border-none bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-2 shadow-sm"
                    >
                        <MessageOutlined /> HỎI AI
                    </Button>
                    <Button
                        type="text"
                        icon={<ReloadOutlined />}
                        onClick={onAnalyze}
                        loading={isAiLoading}
                        className="w-10 h-10 rounded-full dark:text-white/40 hover:text-indigo-500"
                    />
                </div>

                <div className="p-8 lg:p-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
                            <RobotOutlined className="text-white text-lg" />
                        </div>
                        <Title level={5} className="m-0 dark:text-white font-black tracking-tight uppercase opacity-60 text-[11px]">CÔNG CỤ PHÂN TÍCH THÔNG MINH</Title>
                    </div>

                    {isAiLoading ? (
                        <Row gutter={[40, 40]}>
                            <Col span={16}><Skeleton active paragraph={{ rows: 3 }} /></Col>
                            <Col span={8}><Skeleton.Button active block style={{ height: 150, borderRadius: 24 }} /></Col>
                        </Row>
                    ) : (
                        <Row gutter={[48, 32]} align="stretch">
                            <Col xs={24} lg={15}>
                                <Paragraph className="text-xl font-bold leading-relaxed dark:text-gray-200 m-0 tracking-tight">
                                    "{aiAnalysis?.summary}"
                                </Paragraph>

                                <div className="mt-10">
                                    <Text strong className="text-[10px] uppercase tracking-[0.2em] text-indigo-500 mb-4 block font-black opacity-50">Chiến lược đề xuất</Text>
                                    <div className="flex flex-wrap gap-2">
                                        {aiAnalysis?.recommendations.map((rec, i) => (
                                            <motion.div
                                                key={i}
                                                whileHover={{ y: -2 }}
                                                className="px-4 py-1.5 rounded-xl bg-white/50 dark:bg-white/5 border border-white/20 dark:border-white/10 shadow-sm flex items-center gap-2 cursor-pointer group"
                                            >
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                <Text className="font-bold text-[11px] dark:text-white/70">{rec}</Text>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </Col>

                            <Col xs={24} lg={9}>
                                <div className="h-full bg-white/30 dark:bg-black/20 p-6 rounded-[28px] border border-white/20 dark:border-white/5 relative overflow-hidden">
                                    <Text strong className="text-[10px] uppercase tracking-[0.2em] text-indigo-500 mb-6 block font-black opacity-50">Điểm nóng & Rủi ro</Text>
                                    <div className="flex flex-col gap-5">
                                        {aiAnalysis?.insights.map((insight, i) => (
                                            <div key={i} className="flex gap-3 group/item">
                                                <BulbOutlined className="text-indigo-500 mt-1" />
                                                <Text className="text-xs font-semibold leading-relaxed opacity-60 group-hover/item:opacity-100 transition-opacity">{insight}</Text>
                                            </div>
                                        ))}
                                    </div>
                                    <RobotOutlined className="absolute -bottom-6 -right-6 text-[80px] text-indigo-500/5" />
                                </div>
                            </Col>
                        </Row>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default AiInsightPanel;
