'use client';

import { useEffect, useState } from 'react';
import { HeartOutlined, SyncOutlined, CheckCircleOutlined, WarningOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Card, Progress, Tag, Button, Spin, Statistic, Row, Col } from 'antd';
import { autoRequest } from '@smart/services/auto.request';

interface HealthData {
  status: 'ON_TRACK' | 'AT_RISK' | 'DELAYED';
  score: number;
  summary: string;
}

export default function ProjectHealth({ projectId }: { projectId: string }) {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchHealth = async () => {
    try {
      const res = await autoRequest<{ success: boolean; data: HealthData }>(`/projects/${projectId}/health`, { method: 'GET' });
      if (res.success) {
        setHealth(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch health', err);
    } finally {
      setLoading(false);
    }
  };

  const analyzeHealth = async () => {
    setAnalyzing(true);
    try {
      const res = await autoRequest<{ success: boolean; data: { health: HealthData } }>(`/projects/${projectId}/ai/health`, { method: 'POST' });
      if (res.success) {
        setHealth(res.data.health);
      }
    } catch (err) {
      console.error('Failed to analyze health', err);
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, [projectId]);

  if (loading) return <div className="p-8 flex justify-center"><Spin /></div>;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ON_TRACK': return <CheckCircleOutlined className="text-green-500" />;
      case 'AT_RISK': return <WarningOutlined className="text-yellow-500" />;
      case 'DELAYED': return <CloseCircleOutlined className="text-red-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ON_TRACK': return 'success';
      case 'AT_RISK': return 'warning';
      case 'DELAYED': return 'error';
      default: return 'default';
    }
  };

  return (
    <div className="p-6 h-full bg-white dark:bg-neutral-900 overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <HeartOutlined className="text-red-500" />
          Project Health
        </h2>
        <Button 
          type="primary" 
          icon={<SyncOutlined spin={analyzing} />} 
          onClick={analyzeHealth}
          disabled={analyzing}
          className="bg-blue-600 border-none"
        >
          AI Refresh
        </Button>
      </div>

      {health ? (
        <div className="space-y-6">
          <Card className="bg-neutral-50 dark:bg-neutral-800 border-none shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{getStatusIcon(health.status)}</div>
                <div>
                  <div className="text-sm opacity-50 uppercase tracking-wider">Status</div>
                  <Tag color={getStatusColor(health.status)} className="font-bold">
                    {health.status.replace('_', ' ')}
                  </Tag>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-50 mb-1">Health Score</div>
                <Progress 
                  type="circle" 
                  percent={health.score} 
                  size={50} 
                  strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }} 
                />
              </div>
            </div>
            <p className="text-neutral-700 dark:text-neutral-300 italic">
              "{health.summary}"
            </p>
          </Card>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card size="small" className="bg-blue-50 dark:bg-blue-900/20 border-none text-center">
                <Statistic title="Tasks Done" value="75%" prefix={<CheckCircleOutlined />} />
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" className="bg-red-50 dark:bg-red-900/20 border-none text-center">
                <Statistic title="Overdue" value={3} prefix={<WarningOutlined />} />
              </Card>
            </Col>
          </Row>

          <div className="mt-4">
            <div className="text-sm font-semibold mb-2">Team Sentiment (AI Analysis)</div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800 flex items-center gap-3">
               <div className="text-2xl">😊</div>
               <div className="text-sm">
                 Tâm trạng của team đang rất tích cực. Các thành viên tương tác thường xuyên và hỗ trợ nhau tốt.
               </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 opacity-50">
          Chưa có dữ liệu sức khỏe. Hãy nhấn nút AI Refresh để bắt đầu phân tích.
        </div>
      )}
    </div>
  );
}
