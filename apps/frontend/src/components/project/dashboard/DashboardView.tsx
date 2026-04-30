'use client';

import React, { useMemo, useState } from 'react';
import { Row, Col, Typography, theme as antdTheme, Tag, Tooltip, Button, message, Spin } from 'antd';
import { ThunderboltOutlined, PrinterOutlined, HeartOutlined, SyncOutlined } from '@ant-design/icons';
import { autoRequest } from '@smart/services/auto.request';
import { Board as BoardType } from '@smart/types/project';
import { projectStore } from '@smart/store/project';
import { useBoardStore } from '@smart/store/setting';
import { projectService } from '@smart/services/project.service';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';

// Sub-components
import AiInsightPanel from './components/AiInsightPanel';
import KpiMetrics from './components/KpiMetrics';
import HealthAnalytics from './components/HealthAnalytics';
import MemberWorkload from './components/MemberWorkload';
import UpcomingRoadmap from './components/UpcomingRoadmap';
import AiChatDrawer from './components/AiChatDrawer';
import ProjectViewHeader from '../ProjectViewHeader';

const { Title, Text } = Typography;

interface Props {
  board: BoardType;
}

interface AiAnalysis {
  summary: string;
  insights: string[];
  recommendations: string[];
}

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
}

const DashboardView: React.FC<Props> = ({ board }) => {
  const { token } = antdTheme.useToken();
  const theme = useBoardStore((s) => s.resolvedTheme);
  const { cards, columnCards, boardColumns, columns, currentProject } = projectStore();

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);
  const [healthData, setHealthData] = useState<any>(null);
  const [sentimentData, setSentimentData] = useState<any>(null);

  // Chat AI State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      role: 'ai',
      content: 'Chào bạn! Tôi là trợ lý AI của Smart Collab. Bạn có muốn biết thêm chi tiết về tiến độ board này không?',
      timestamp: dayjs().format('HH:mm')
    }
  ]);

  const boardCards = useMemo(() => {
    const columnIds = boardColumns[board.id] || [];
    const allCardIds = columnIds.flatMap((colId) => columnCards[colId] || []);
    return allCardIds.map((id) => cards[id]).filter(Boolean);
  }, [board.id, boardColumns, columnCards, cards]);

  const handleAiAnalyze = async () => {
    setIsAiLoading(true);
    const { currentProject } = projectStore.getState();
    try {
      const projectId = currentProject?.id || board.projectId || board.id;
      
      // Run analyses (Health is now merged into board analysis on BE)
      const [boardAnalysis, sentimentRes] = await Promise.all([
        projectService.analyzeBoard(projectId),
        autoRequest<any>(`/projects/${projectId}/ai/sentiment`, { method: 'POST' })
      ]);

      if (boardAnalysis.success) {
        if (boardAnalysis.analysis) setAiAnalysis(boardAnalysis.analysis);
        if (boardAnalysis.health) setHealthData(boardAnalysis.health);
      }
      
      if (sentimentRes.success) {
        setSentimentData(sentimentRes);
      }
      
      message.success('Đã hoàn thành phân tích toàn diện');
    } catch (error) {
      message.error('Lỗi khi gọi AI Service');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAskAi = async (query?: string) => {
    const q = query || userQuery;
    if (!q.trim()) return;

    const newMsg: ChatMessage = { role: 'user', content: q, timestamp: dayjs().format('HH:mm') };
    setChatHistory(prev => [...prev, newMsg]);
    if (!query) setUserQuery('');

    setChatLoading(true);
    try {
      const { currentProject } = projectStore.getState();
      const res = await projectService.askBoard(currentProject?.id || board.id, q);

      if (res.success) {
        setChatHistory(prev => [...prev, {
          role: 'ai',
          content: res.answer,
          timestamp: dayjs().format('HH:mm')
        }]);
      } else {
        message.error('AI không thể trả lời lúc này');
      }
    } catch (error) {
      message.error('Lỗi kết nối AI');
    } finally {
      setChatLoading(false);
    }
  };

  const stats = useMemo(() => {
    const total = boardCards.length;
    const columnIds = boardColumns[board.id] || [];
    const lastColumnId = columnIds[columnIds.length - 1];
    const doneCards = boardCards.filter(c => c.columnId === lastColumnId || c.status === 'ARCHIVED');

    const highPriority = boardCards.filter(c => c.priority === 3 || c.priority === 2).length;
    const overdue = boardCards.filter(c => c.deadline && dayjs(c.deadline).isBefore(dayjs()) && c.columnId !== lastColumnId).length;

    let totalChecklistItems = 0;
    let completedChecklistItems = 0;
    boardCards.forEach(c => {
      if (c.checklist) {
        totalChecklistItems += c.checklist.length;
        completedChecklistItems += c.checklist.filter(item => item.done).length;
      }
    });

    return {
      total,
      done: doneCards.length,
      percent: total > 0 ? Math.round((doneCards.length / total) * 100) : 0,
      highPriority,
      overdue,
      checklistPercent: totalChecklistItems > 0 ? Math.round((completedChecklistItems / totalChecklistItems) * 100) : 0,
      totalChecklist: totalChecklistItems,
      doneChecklist: completedChecklistItems
    };
  }, [boardCards, board.id, boardColumns]);

  const memberWorkload = useMemo(() => {
    const workload: Record<string, { name: string, avatar: string, count: number, done: number }> = {};
    boardCards.forEach(card => {
      card.members?.forEach(m => {
        if (!workload[m.userId]) {
          workload[m.userId] = { name: m.userName || 'Member', avatar: m.userAvatar || '', count: 0, done: 0 };
        }
        workload[m.userId].count++;
        const columnIds = boardColumns[board.id] || [];
        if (card.columnId === columnIds[columnIds.length - 1]) {
          workload[m.userId].done++;
        }
      });
    });
    return Object.values(workload).sort((a, b) => b.count - a.count);
  }, [boardCards, board.id, boardColumns]);

  const upcomingTasks = useMemo(() => {
    return [...boardCards]
      .filter(c => c.deadline && dayjs(c.deadline).isAfter(dayjs()) && c.columnId !== (boardColumns[board.id] || [])[(boardColumns[board.id] || []).length - 1])
      .sort((a, b) => dayjs(a.deadline).unix() - dayjs(b.deadline).unix())
      .slice(0, 5);
  }, [boardCards, boardColumns, board.id]);

  const glassStyle = {
    borderRadius: '24px',
    border: theme === 'dark' ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.03)',
    background: theme === 'dark' ? 'rgba(30, 31, 34, 0.4)' : 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(30px)',
    boxShadow: theme === 'dark' ? 'none' : '0 12px 40px -12px rgba(0,0,0,0.05)',
    overflow: 'hidden'
  } as React.CSSProperties;

  return (
    <div className="h-full flex flex-col bg-[#f0f2f5] dark:bg-[#0a0a0b] overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar relative print-container">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="max-w-[1600px] mx-auto"
        >
          {/* Dashboard Header */}
          <ProjectViewHeader
            icon={<ThunderboltOutlined style={{ fontSize: 24 }} />}
            title={`Phân tích: ${projectStore.getState().currentProject?.name || ''}`}
            tagText="Chỉ số trực tiếp"
            tagColor="processing"
            count={stats.total}
            extra={
              <div className="flex items-center gap-3">
                <AnimatePresence>
                  {(!aiAnalysis && !isAiLoading) && (
                    <motion.div
                      key="actions"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10, filter: 'blur(10px)' }}
                      className="flex items-center gap-3"
                    >
                      <Button
                        onClick={() => setIsChatOpen(true)}
                        className="h-9 px-6 rounded-full border-gray-200 dark:border-white/10 font-bold text-[11px] text-gray-600 dark:text-gray-300 shadow-sm glass hover:scale-105"
                      >
                        HỎI AI
                      </Button>
                      <Button
                        onClick={handleAiAnalyze}
                        loading={isAiLoading}
                        className="h-9 px-8 rounded-full border-none font-bold text-[11px] text-white shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-105 transition-all"
                      >
                        TẠO BÁO CÁO
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
                <Tooltip title="Xuất PDF / In báo cáo">
                  <Button
                    onClick={() => window.print()}
                    icon={<PrinterOutlined />}
                    className="h-9 w-9 rounded-full border-gray-200 dark:border-white/10 shadow-sm glass flex items-center justify-center hover:text-indigo-500 transition-all"
                  />
                </Tooltip>
              </div>
            }
          />

          <AiInsightPanel
            aiAnalysis={aiAnalysis}
            isAiLoading={isAiLoading}
            theme={theme}
            token={token}
            onAnalyze={handleAiAnalyze}
            onOpenChat={() => setIsChatOpen(true)}
          />

          <KpiMetrics stats={stats} glassStyle={glassStyle} />

          <Row gutter={[24, 24]}>
            <Col xs={24} xl={16}>
              <HealthAnalytics
                stats={stats}
                columns={columns}
                boardColumns={boardColumns[board.id] || []}
                boardId={board.id}
                cards={cards}
                glassStyle={glassStyle}
                token={token}
                healthData={healthData}
                sentimentData={sentimentData}
                projectId={currentProject?.id || board.projectId || board.id}
              />
            </Col>
            <Col xs={24} xl={8}>
              <MemberWorkload
                memberWorkload={memberWorkload}
                totalCards={stats.total}
                glassStyle={glassStyle}
                theme={theme}
              />
            </Col>
            <Col xs={24}>
              <UpcomingRoadmap
                tasks={upcomingTasks}
                columns={columns}
                glassStyle={glassStyle}
              />
            </Col>
          </Row>
        </motion.div>
      </div>

      <AiChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        chatHistory={chatHistory}
        chatLoading={chatLoading}
        userQuery={userQuery}
        setUserQuery={setUserQuery}
        onSend={handleAskAi}
        onClear={() => setChatHistory([{
          role: 'ai',
          content: 'Tôi đã sẵn sàng trợ giúp bạn. Bạn muốn hỏi gì về board này?',
          timestamp: dayjs().format('HH:mm')
        }])}
        theme={theme}
      />

      <style jsx global>{`
        .glass {
          background: rgba(255, 255, 255, 0.4);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .dark .glass {
          background: rgba(30, 31, 34, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.4);
        }
        .prose strong { color: inherit; font-weight: 800; }
        .prose ul { padding-left: 1.2rem; }

        @media print {
          html, body, #__next, .ant-layout, .ant-layout-content {
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }
          .ant-layout-sider, .ant-layout-header, .ant-layout-footer, .SiteHeader, nav, header, footer, .no-print, .ant-drawer, .ant-message, .ant-btn:not(.print-only) {
            display: none !important;
            height: 0 !important;
            width: 0 !important;
            overflow: hidden !important;
          }
          .print-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            padding: 20px !important;
            visibility: visible !important;
            display: block !important;
          }
          .max-w-\[1600px\] { max-width: 100% !important; }
          .glass, .dark .glass {
            background: white !important;
            backdrop-filter: none !important;
            border: 1px solid #eee !important;
            box-shadow: none !important;
          }
          .bg-[#f0f2f5], .dark .bg-[#0a0a0b] { background: white !important; }
          h1, h2, h3, h4, h5, .ant-typography, .ant-statistic-title, .ant-statistic-content { color: black !important; }
          .ant-card {
            border: 1px solid #f0f0f0 !important;
            break-inside: avoid;
            margin-bottom: 20px !important;
          }
          .ai-panel-container { background: #f8f9ff !important; border: 1px solid #e6e8ff !important; page-break-after: auto; }
          .ant-progress-text { color: black !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
};

export default DashboardView;
