'use client';

import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Progress, Typography, Tag, Statistic, Spin, Empty } from 'antd';
import {
  HeartOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
  RiseOutlined,
  MessageOutlined
} from '@ant-design/icons';
import { autoRequest } from '@smart/services/auto.request';

const { Text } = Typography;

interface Props {
  stats: any;
  columns: any;
  boardColumns: string[];
  boardId: string;
  cards: any;
  glassStyle: React.CSSProperties;
  token: any;
  healthData?: any;
  sentimentData?: any;
  projectId: string;
}

const HealthAnalytics: React.FC<Props> = ({
  stats,
  columns,
  boardColumns,
  boardId,
  cards,
  glassStyle,
  token,
  healthData: initialHealth,
  sentimentData: initialSentiment,
  projectId
}) => {
  const [health, setHealth] = useState<any>(initialHealth);
  const [sentiment, setSentiment] = useState<any>(initialSentiment);
  const [loading, setLoading] = useState(!initialHealth);

  useEffect(() => {
    if (initialHealth) setHealth(initialHealth);
    if (initialSentiment) setSentiment(initialSentiment);
  }, [initialHealth, initialSentiment]);

  useEffect(() => {
    const fetchData = async () => {
      if (initialHealth) return;
      setLoading(true);
      try {
        const hRes = await autoRequest<any>(`/projects/${projectId}/health`, { method: 'GET' });
        if (hRes.success) setHealth(hRes.data);
      } catch (err) {
        console.error('Failed to fetch dashboard health', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ON_TRACK': return <CheckCircleOutlined className="text-green-500" />;
      case 'AT_RISK': return <WarningOutlined className="text-yellow-500" />;
      case 'DELAYED': return <CloseCircleOutlined className="text-red-500" />;
      default: return <ThunderboltOutlined className="text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ON_TRACK': return 'green';
      case 'AT_RISK': return 'gold';
      case 'DELAYED': return 'red';
      default: return 'blue';
    }
  };

  const getSentimentEmoji = (s?: string) => {
    switch (s) {
      case 'POSITIVE': return '😊';
      case 'NEGATIVE': return '😟';
      case 'NEUTRAL':
      default: return '😐';
    }
  };

  if (loading) return (
    <Card bordered={false} style={glassStyle} className="h-[400px] flex items-center justify-center">
      <Spin tip="Đang tải dữ liệu sức khỏe..." />
    </Card>
  );

  return (
    <Card
      bordered={false}
      style={glassStyle}
      title={<div className="flex justify-between items-center"><span className="flex items-center gap-2"><HeartOutlined className="text-red-500" /> Năng Lượng Thiên Hà (AI)</span></div>}
    >
      {!health ? (
        <div className="py-20 flex flex-col items-center justify-center opacity-40">
          <Empty description="Nhấn 'TẠO BÁO CÁO' để AI phân tích sức khỏe dự án" />
        </div>
      ) : (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={14}>
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-6 bg-white/5 p-5 rounded-[24px] border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{getStatusIcon(health.status)}</div>
                  <div>
                    <Text className="text-[10px] uppercase font-black opacity-40 tracking-widest block mb-1">Trạng thái</Text>
                    <Tag color={getStatusColor(health.status)} className="border-none px-3 font-black rounded-full text-xs">
                      {health.status.replace('_', ' ')}
                    </Tag>
                  </div>
                </div>
                <div className="text-right">
                  <Text className="text-[10px] uppercase font-black opacity-40 tracking-widest block mb-1">Điểm AI</Text>
                  <Progress
                    type="circle"
                    percent={health.score}
                    size={60}
                    strokeWidth={12}
                    strokeColor={{ '0%': '#3b82f6', '100%': '#10b981' }}
                  />
                </div>
              </div>

              <div className="flex-1 bg-indigo-500/5 p-5 rounded-[24px] border border-indigo-500/10 relative overflow-hidden group min-h-[120px]">
                <RiseOutlined className="absolute top-4 right-4 text-2xl opacity-5 group-hover:opacity-20 transition-opacity" />
                <h4 className="text-[10px] font-black uppercase text-indigo-500 mb-2 tracking-widest">
                  AI Summary
                </h4>
                <p className="text-[13px] font-medium leading-relaxed italic m-0 opacity-80">
                  "{health.summary}"
                </p>
              </div>
            </div>
          </Col>

          <Col xs={24} lg={10}>
            <div className="flex flex-col gap-3">
              <Card className="bg-blue-600 rounded-[20px] border-none text-white p-1 shadow-lg shadow-blue-500/10">
                <Statistic
                  title={<span className="text-blue-100 text-[9px] font-bold uppercase tracking-widest">Hoàn thành</span>}
                  value={health.insights?.completedTasks || 0}
                  suffix={`/ ${health.insights?.totalTasks || 0}`}
                  valueStyle={{ color: 'white', fontWeight: 900, fontSize: '1.2rem' }}
                />
              </Card>

              <Card className="bg-white/5 rounded-[20px] border border-white/5 p-1">
                <div className="flex items-center gap-2 mb-2">
                  <MessageOutlined className="text-green-500 text-xs" />
                  <Text className="text-[9px] font-black uppercase opacity-40 tracking-widest">Cảm xúc Team</Text>
                </div>
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{getSentimentEmoji(sentiment?.sentiment)}</div>
                  <div className="min-w-0">
                    <div className="text-[9px] font-bold text-neutral-400 uppercase">{sentiment?.sentiment || 'Ready'}</div>
                    <Text className="text-[10px] leading-tight block truncate opacity-70">
                      {sentiment?.summary || 'Chưa có dữ liệu'}
                    </Text>
                  </div>
                </div>
              </Card>

              <Card className="bg-red-500 rounded-[20px] border-none text-white p-1 shadow-lg shadow-red-500/10">
                <Statistic
                  title={<span className="text-red-100 text-[9px] font-bold uppercase tracking-widest">Quá hạn</span>}
                  value={health.insights?.overdueTasks || 0}
                  valueStyle={{ color: 'white', fontWeight: 900, fontSize: '1.2rem' }}
                  prefix={<WarningOutlined className="opacity-50 text-sm" />}
                />
              </Card>
            </div>
          </Col>
        </Row>
      )}
    </Card>
  );
};

export default HealthAnalytics;
