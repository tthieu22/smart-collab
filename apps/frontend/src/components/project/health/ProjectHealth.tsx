'use client';

import { useEffect, useState } from 'react';
import {
  HeartOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
  RiseOutlined,
  MessageOutlined
} from '@ant-design/icons';
import { Card, Progress, Tag, Button, Spin, Statistic, Row, Col, message, Empty } from 'antd';
import { autoRequest } from '@smart/services/auto.request';

interface HealthData {
  status: 'ON_TRACK' | 'AT_RISK' | 'DELAYED';
  score: number;
  summary: string;
  insights?: {
    completedTasks: number;
    totalTasks: number;
    overdueTasks: number;
  };
}

interface SentimentData {
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  summary: string;
}

export default function ProjectHealth({ projectId }: { projectId: string }) {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [sentiment, setSentiment] = useState<SentimentData | null>(null);
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
    const hide = message.loading('AI đang phân tích dữ liệu dự án...', 0);
    try {
      // 1. Analyze Health
      const res = await autoRequest<{ success: boolean; health: HealthData }>(`/projects/${projectId}/ai/health`, { method: 'POST' });

      // 2. Analyze Sentiment (Parallel)
      const sentRes = await autoRequest<{ success: boolean; sentiment: string; summary: string }>(`/projects/${projectId}/ai/sentiment`, { method: 'POST' });

      if (res.success) {
        setHealth(res.health);
        message.success('Phân tích sức khỏe hoàn tất');
      }
      if (sentRes.success) {
        setSentiment({
          sentiment: sentRes.sentiment as any,
          summary: sentRes.summary
        });
      }
    } catch (err: any) {
      console.error('Failed to analyze health', err);
      message.error(err.message || 'Phân tích thất bại. Vui lòng thử lại.');
    } finally {
      hide();
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, [projectId]);

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center gap-4 bg-white dark:bg-[#0b1220]">
      <Spin size="large" />
      <span className="text-sm opacity-40 font-sans">Đang tổng hợp dữ liệu...</span>
    </div>
  );

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

  return (
    <div className="p-8 h-full bg-white dark:bg-[#0b1220] overflow-y-auto custom-scrollbar font-sans transition-colors duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center">
              <HeartOutlined className="text-xl text-red-500" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-neutral-800 dark:text-neutral-100 m-0">
              Project Health
            </h1>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 m-0">
            Phân tích tình trạng dự án dựa trên tiến độ, deadline và tương tác của team.
          </p>
        </div>

        <Button
          type="primary"
          icon={<SyncOutlined spin={analyzing} />}
          onClick={analyzeHealth}
          disabled={analyzing}
          className="bg-blue-600 hover:bg-blue-700 border-none shadow-lg shadow-blue-500/25 h-11 px-6 rounded-xl font-bold flex items-center gap-2"
        >
          {analyzing ? 'AI Analyzing...' : 'AI Refresh Analysis'}
        </Button>
      </div>

      {!health && !analyzing ? (
        <div className="h-96 flex flex-col items-center justify-center bg-neutral-50 dark:bg-white/5 rounded-3xl border-2 border-dashed border-neutral-200 dark:border-white/10">
          <Empty
            description={
              <div className="flex flex-col items-center gap-2">
                <span className="text-lg font-bold text-neutral-400">Chưa có dữ liệu phân tích</span>
                <Button type="link" onClick={analyzeHealth}>Nhấn để AI bắt đầu phân tích ngay</Button>
              </div>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-700">
          {/* MAIN STATUS CARD */}
          <Card className="lg:col-span-2 rounded-3xl border-none shadow-xl shadow-neutral-200/50 dark:shadow-none bg-neutral-50 dark:bg-white/5 overflow-hidden">
            <div className="relative p-2">
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="text-5xl">{getStatusIcon(health?.status || '')}</div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-400 m-0 mb-1">Current Status</h3>
                    <Tag color={getStatusColor(health?.status || '')} className="border-none px-3 py-0.5 rounded-full font-black text-sm uppercase">
                      {(health?.status || 'UNKNOWN').replace('_', ' ')}
                    </Tag>
                  </div>
                </div>

                <div className="text-right">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-neutral-400 m-0 mb-2">Overall Score</h3>
                  <Progress
                    type="circle"
                    percent={health?.score || 0}
                    size={80}
                    strokeWidth={10}
                    strokeColor={{ '0%': '#3b82f6', '100%': '#10b981' }}
                    className="font-black"
                  />
                </div>
              </div>

              <div className="bg-white dark:bg-white/5 p-6 rounded-2xl border border-neutral-100 dark:border-white/5 relative">
                <RiseOutlined className="absolute top-4 right-4 text-2xl opacity-10" />
                <h4 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 mb-3 flex items-center gap-2">
                  <ThunderboltOutlined /> AI Summary
                </h4>
                <p className="text-lg font-medium leading-relaxed text-neutral-700 dark:text-neutral-200 italic m-0">
                  "{health?.summary || 'Đang phân tích...'}"
                </p>
              </div>
            </div>
          </Card>

          {/* QUICK STATS & SENTIMENT */}
          <div className="space-y-6">
            <Card className="rounded-3xl border-none shadow-lg bg-blue-600 text-white p-2">
              <Statistic
                title={<span className="text-blue-100 font-bold uppercase tracking-widest text-[10px]">Tasks Completed</span>}
                value={health?.insights?.completedTasks || 0}
                suffix={`/ ${health?.insights?.totalTasks || 0}`}
                valueStyle={{ color: 'white', fontWeight: 900, fontSize: '2rem' }}
                prefix={<CheckCircleOutlined className="opacity-50" />}
              />
              <Progress
                percent={Math.round(((health?.insights?.completedTasks || 0) / (health?.insights?.totalTasks || 1)) * 100)}
                showInfo={false}
                strokeColor="white"
                trailColor="rgba(255,255,255,0.2)"
                className="mt-4"
              />
            </Card>

            <Card className="rounded-3xl border-none shadow-lg bg-neutral-50 dark:bg-white/5 p-2 border border-neutral-100 dark:border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-xl">
                  <MessageOutlined className="text-green-500" />
                </div>
                <h4 className="text-sm font-black uppercase tracking-widest text-neutral-400 m-0">Team Sentiment</h4>
              </div>

              <div className="flex items-start gap-4">
                <div className="text-4xl filter drop-shadow-md">
                  {getSentimentEmoji(sentiment?.sentiment)}
                </div>
                <div>
                  <div className="text-xs font-bold text-neutral-400 mb-1 uppercase">
                    {sentiment?.sentiment || 'Analyzing...'}
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-snug m-0">
                    {sentiment?.summary || 'Hãy nhấn Refresh để phân tích tâm trạng của team dựa trên các trao đổi gần đây.'}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="rounded-3xl border-none shadow-lg bg-red-500 text-white p-2">
              <Statistic
                title={<span className="text-red-100 font-bold uppercase tracking-widest text-[10px]">Critical Overdue</span>}
                value={health?.insights?.overdueTasks || 0}
                valueStyle={{ color: 'white', fontWeight: 900, fontSize: '2rem' }}
                prefix={<WarningOutlined className="opacity-50" />}
              />
              <div className="text-[10px] uppercase font-black opacity-60 mt-2">Cần xử lý ngay lập tức</div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
