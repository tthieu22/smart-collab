'use client';

import React, { useMemo, useState } from 'react';
import { Row, Col, Card, Statistic, Progress, List, Avatar, Typography, theme as antdTheme, Tag, Tooltip, Space, Button, Skeleton, Empty, message } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  LineChartOutlined,
  TeamOutlined,
  AlertOutlined,
  ThunderboltOutlined,
  TagOutlined,
  ProjectOutlined,
  CarryOutOutlined,
  RobotOutlined,
  BulbOutlined,
  RocketOutlined,
  ReloadOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Board as BoardType, Card as CardType } from '@smart/types/project';
import { projectStore } from '@smart/store/project';
import { useBoardStore } from '@smart/store/setting';
import { projectService } from '@smart/services/project.service';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

interface Props {
  board: BoardType;
}

interface AiAnalysis {
  summary: string;
  insights: string[];
  recommendations: string[];
}

const DashboardView: React.FC<Props> = ({ board }) => {
  const { token } = antdTheme.useToken();
  const theme = useBoardStore((s) => s.theme);
  const { cards, columnCards, boardColumns, columns } = projectStore();

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysis | null>(null);

  const boardCards = useMemo(() => {
    const columnIds = boardColumns[board.id] || [];
    const allCardIds = columnIds.flatMap((colId) => columnCards[colId] || []);
    return allCardIds.map((id) => cards[id]).filter(Boolean);
  }, [board.id, boardColumns, columnCards, cards]);

  const handleAiAnalyze = async () => {
    setIsAiLoading(true);
    const { currentProject } = projectStore.getState();
    try {
      const res = await projectService.analyzeBoard(currentProject?.id || board.projectId || board.id);
      if (res.success && res.analysis) {
        setAiAnalysis(res.analysis);
        message.success('Đã hoàn thành phân tích AI');
      } else {
        message.error('Không thể phân tích dữ liệu');
      }
    } catch (error) {
      message.error('Lỗi khi gọi AI Service');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Thống kê cơ bản
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

  // Phân bổ theo Thành viên
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

  // Phân bổ theo Nhãn
  const labelStats = useMemo(() => {
    const labels: Record<string, { name: string, color: string, count: number }> = {};
    boardCards.forEach(card => {
      card.labels?.forEach(l => {
        if (!labels[l.label]) {
          labels[l.label] = { name: l.label, color: l.color, count: 0 };
        }
        labels[l.label].count++;
      });
    });
    return Object.values(labels).sort((a, b) => b.count - a.count);
  }, [boardCards]);

  // Phân bổ theo Column
  const columnData = useMemo(() => {
    const columnIds = boardColumns[board.id] || [];
    return columnIds.map(id => ({
      title: columns[id]?.title || 'Unknown',
      count: columnCards[id]?.length || 0,
      color: theme === 'dark' ? token.colorPrimary : token.colorPrimary
    }));
  }, [board.id, boardColumns, columns, columnCards, theme, token.colorPrimary]);

  // Sắp xếp các task sắp tới
  const upcomingTasks = useMemo(() => {
    return [...boardCards]
      .filter(c => c.deadline && dayjs(c.deadline).isAfter(dayjs()) && c.columnId !== (boardColumns[board.id] || [])[(boardColumns[board.id] || []).length - 1])
      .sort((a, b) => dayjs(a.deadline).unix() - dayjs(b.deadline).unix())
      .slice(0, 5);
  }, [boardCards]);

  const cardStyle = {
    borderRadius: '20px',
    border: theme === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.05)',
    background: theme === 'dark' ? 'rgba(30, 31, 34, 0.6)' : '#fff',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px -4px rgba(0,0,0,0.08)',
  };

  const aiCardStyle = {
    ...cardStyle,
    background: theme === 'dark'
      ? 'linear-gradient(135deg, rgba(30, 31, 34, 0.8) 0%, rgba(58, 48, 114, 0.2) 100%)'
      : 'linear-gradient(135deg, #fff 0%, #f0f5ff 100%)',
    border: theme === 'dark' ? '1px solid rgba(131, 103, 255, 0.2)' : '1px solid rgba(24, 144, 255, 0.1)',
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 scroll-smooth scrollbar-hide">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-10 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500 rounded-lg shadow-lg shadow-blue-500/20">
                <ProjectOutlined className="text-white text-xl" />
              </div>
              <Title level={2} className="m-0">
                Báo cáo {projectStore.getState().currentProject?.name}
                <Text type="secondary" style={{ fontSize: '20px', fontWeight: 400, marginLeft: '8px' }}>
                  / {board.title}
                </Text>
              </Title>
            </div>
            <Text type="secondary" className="text-sm">Phân tích hiệu suất dự án và thống kê chi tiết các hoạt động của thành viên.</Text>
          </div>
          <Button
            type="primary"
            icon={isAiLoading ? <ReloadOutlined spin /> : <RobotOutlined />}
            onClick={handleAiAnalyze}
            loading={isAiLoading}
            className="rounded-full px-6 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 border-none shadow-lg shadow-blue-500/20"
          >
            Tóm tắt với AI
          </Button>
        </div>

        {/* AI Insights Section */}
        <AnimatePresence mode="wait">
          {(isAiLoading || aiAnalysis) && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 32 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <Card style={aiCardStyle} bodyStyle={{ padding: '32px' }}>
                {isAiLoading ? (
                  <div className="py-4">
                    <Skeleton active avatar paragraph={{ rows: 4 }} title />
                    <div className="flex gap-4 mt-6">
                      <Skeleton.Button active shape="round" style={{ width: 150 }} />
                      <Skeleton.Button active shape="round" style={{ width: 150 }} />
                    </div>
                  </div>
                ) : aiAnalysis && (
                  <Row gutter={[32, 32]}>
                    <Col xs={24} xl={13}>
                      <div className="flex flex-col gap-6 h-full">
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                              <RobotOutlined />
                            </div>
                            <Title level={4} className="m-0 tracking-tight">AI Summary</Title>
                          </div>
                          <Paragraph className="text-lg leading-relaxed italic opacity-90 break-words border-l-4 border-blue-500/30 pl-4 py-1">
                            "{aiAnalysis.summary}"
                          </Paragraph>
                        </div>

                        <div>
                          <Text strong className="text-[10px] uppercase tracking-[0.2em] text-blue-500 mb-3 block">Gợi ý hành động</Text>
                          <div className="flex flex-wrap gap-2">
                            {aiAnalysis.recommendations.map((rec, i) => (
                              <Tag key={i} color="blue" bordered={false} className="rounded-full px-4 py-1 flex items-center gap-2 m-0 bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                <RocketOutlined className="text-[10px]" /> {rec}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Col>

                    <Col xs={24} xl={11}>
                      <div className={`p-6 rounded-2xl h-full ${theme === 'dark' ? 'bg-white/5' : 'bg-blue-50/30'} border border-blue-500/10`}>
                        <Text strong className="text-[10px] uppercase tracking-[0.2em] text-indigo-500 mb-4 block">Nhận định chi tiết</Text>
                        <List
                          dataSource={aiAnalysis.insights}
                          split={false}
                          renderItem={(insight) => (
                            <List.Item className="border-none py-2 px-0">
                              <div className="flex items-start gap-3">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                <Text className="opacity-85 text-sm leading-relaxed">{insight}</Text>
                              </div>
                            </List.Item>
                          )}
                        />
                      </div>
                    </Col>
                  </Row>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Row: Summary Stats */}
        <Row gutter={[24, 24]} className="mb-8">
          {[
            { title: 'Tổng công việc', value: stats.total, icon: <LineChartOutlined />, color: '#1890ff' },
            { title: 'Đã hoàn thành', value: stats.done, icon: <CheckCircleOutlined />, color: '#52c41a' },
            { title: 'Ưu tiên cao', value: stats.highPriority, icon: <ThunderboltOutlined />, color: '#f5222d' },
            { title: 'Công việc quá hạn', value: stats.overdue, icon: <AlertOutlined />, color: '#fa8c16' },
          ].map((item, idx) => (
            <Col xs={24} sm={12} lg={6} key={idx}>
              <Card style={cardStyle} bodyStyle={{ padding: '24px' }}>
                <Statistic
                  title={<Text type="secondary" className="text-[10px] uppercase font-bold tracking-widest">{item.title}</Text>}
                  value={item.value}
                  valueStyle={{ color: item.color, fontWeight: 800, fontSize: '28px' }}
                  prefix={React.cloneElement(item.icon as React.DetailedReactHTMLElement<any, any>, { className: 'mr-3' })}
                />
                <div className="mt-2">
                  <Progress
                    percent={stats.total > 0 ? (item.value / stats.total) * 100 : 0}
                    size="small"
                    showInfo={false}
                    strokeColor={item.color}
                  />
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={8}>
            <Card title={<Space><CarryOutOutlined /> Tiến độ dự án</Space>} style={{ ...cardStyle, height: '100%' }}>
              <div className="flex flex-col items-center justify-center py-6">
                <Progress
                  type="dashboard"
                  percent={stats.percent}
                  strokeWidth={12}
                  size={220}
                  strokeColor={{ '0%': '#108ee9', '100%': '#87d068' }}
                  gapDegree={30}
                />
                <div className="mt-6 text-center">
                  <Text strong className="text-2xl block">{stats.done} / {stats.total}</Text>
                  <Text type="secondary" className="text-xs">Số lượng thẻ đã hoàn thành</Text>
                </div>
              </div>
              <div className="mt-4 border-t dark:border-white/10 pt-6">
                <div className="flex justify-between items-center mb-2">
                  <Text type="secondary" className="text-xs uppercase font-bold">Checklist hoàn thành</Text>
                  <Text strong className="text-blue-500">{stats.checklistPercent}%</Text>
                </div>
                <Progress percent={stats.checklistPercent} status="active" strokeColor="#1890ff" />
                <Text type="secondary" className="text-[10px] block mt-1">
                  {stats.doneChecklist} / {stats.totalChecklist} đầu việc trong checklist đã xong
                </Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={16}>
            <Card title={<Space><TeamOutlined /> Khối lượng công việc thành viên</Space>} style={{ ...cardStyle, height: '100%' }}>
              <div className="max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                {memberWorkload.length > 0 ? (
                  <List
                    dataSource={memberWorkload}
                    renderItem={m => (
                      <div className="mb-6 last:mb-0">
                        <div className="flex justify-between items-end mb-2">
                          <Space align="center">
                            <Avatar src={m.avatar} icon={<TeamOutlined />} className="bg-blue-500 shadow-sm" />
                            <div>
                              <Text strong className="block leading-none">{m.name}</Text>
                              <Text type="secondary" className="text-[10px]">{m.count} công việc được giao</Text>
                            </div>
                          </Space>
                          <Text strong className="text-xs">{Math.round((m.done / m.count) * 100)}% hoàn thành</Text>
                        </div>
                        <Progress
                          percent={(m.count / stats.total) * 100}
                          success={{ percent: (m.done / m.count) * 100 }}
                          showInfo={false}
                          strokeColor={token.colorPrimary}
                        />
                      </div>
                    )}
                  />
                ) : (
                  <div className="py-20 text-center"><Text type="secondary">Chưa có thành viên nào được giao việc</Text></div>
                )}
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={14}>
            <Card title={<Space><TagOutlined /> Phân bổ nhãn (Labels)</Space>} style={{ ...cardStyle, height: '100%' }}>
              <div className="flex flex-wrap gap-3 py-4">
                {labelStats.length > 0 ? labelStats.map((l, i) => (
                  <div key={i} className={`p-4 rounded-2xl border flex flex-col gap-2 min-w-[140px] flex-1 ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="flex justify-between items-center">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
                      <Text strong className="text-lg">{l.count}</Text>
                    </div>
                    <Text className="text-xs font-bold truncate">{l.name}</Text>
                  </div>
                )) : (
                  <div className="w-full py-10 text-center"><Text type="secondary">Chưa có nhãn nào được sử dụng</Text></div>
                )}
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Card title={<Space><ProjectOutlined /> Trạng thái cột</Space>} style={{ ...cardStyle, height: '100%' }}>
              <div className="flex flex-col gap-5">
                {columnData.map((item, index) => (
                  <div key={index} className="bg-white/5 dark:bg-black/20 p-3 rounded-xl border border-transparent dark:border-white/5">
                    <div className="flex justify-between mb-2">
                      <Text strong className="text-xs">{item.title}</Text>
                      <Tag color="blue" bordered={false} className="m-0 text-[10px] px-2">{item.count} thẻ</Tag>
                    </div>
                    <Progress
                      percent={stats.total > 0 ? (item.count / stats.total) * 100 : 0}
                      strokeColor={item.color}
                      showInfo={false}
                      status="active"
                      strokeWidth={6}
                    />
                  </div>
                ))}
              </div>
            </Card>
          </Col>

          <Col xs={24}>
            <Card title={<Space><ClockCircleOutlined /> Công việc quan trọng sắp tới hạn</Space>} style={cardStyle}>
              <Row gutter={[24, 24]}>
                {upcomingTasks.length > 0 ? upcomingTasks.map(item => (
                  <Col xs={24} md={12} lg={8} key={item.id}>
                    <div className={`p-4 rounded-2xl border transition-all hover:border-blue-500/50 cursor-pointer ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-sm'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <Tag color={item.priority === 3 ? 'red' : item.priority === 2 ? 'orange' : 'blue'}>
                          {item.priority === 3 ? 'Khẩn cấp' : item.priority === 2 ? 'Cao' : 'Trung bình'}
                        </Tag>
                        <Text type="secondary" className="text-[10px]">{dayjs(item.deadline).format('DD MMM, YYYY')}</Text>
                      </div>
                      <Text strong className="block mb-2 text-sm truncate">{item.title}</Text>
                      <div className="flex justify-between items-center">
                        <Avatar.Group size="small" maxCount={2}>
                          {item.members?.map(m => (
                            <Tooltip title={m.userName} key={m.userId}>
                              <Avatar src={m.userAvatar} icon={<UserOutlined />} />
                            </Tooltip>
                          ))}
                        </Avatar.Group>
                        <Text type="secondary" className="text-[10px]">{item.columnId ? columns[item.columnId]?.title : ''}</Text>
                      </div>
                    </div>
                  </Col>
                )) : (
                  <Empty description="Không có công việc quan trọng nào sắp tới hạn" className="w-full py-10" />
                )}
              </Row>
            </Card>
          </Col>
        </Row>
      </motion.div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default DashboardView;
