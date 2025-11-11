// src/components/cardDetailModal/CardDetailModalById.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  Input,
  Button,
  Typography,
  Space,
  Tag,
  Avatar,
  Divider,
  Skeleton,
  Progress,
  message,
  Upload,
  Checkbox,
  List
} from 'antd';
import {
  EditOutlined,
  CloseOutlined,
  UserOutlined,
  PlusOutlined,
  RobotOutlined,
  PaperClipOutlined,
  CheckSquareOutlined,
  MessageOutlined,
  SendOutlined,
  BoldOutlined,
  ItalicOutlined,
  UnorderedListOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { projectStore } from '@smart/store/project';
import { projectService } from '@smart/services/project.service';
import type { Card, CardComment, ChecklistItem, Attachment } from '@smart/types/project';
import { format } from 'date-fns';
import { Editor } from '@tinymce/tinymce-react';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface Props {
  cardId: string;
  isOpen: boolean;
  onClose: () => void;
}

/* ---------- AI BORDER & ICON ---------- */
const AIBorderWrapper: React.FC<{ children: React.ReactNode; active?: boolean }> = ({
  children,
  active,
}) => (
  <div
    style={{
      position: 'relative',
      borderRadius: 12,
      padding: active ? 3 : 2,
      background: active
        ? 'linear-gradient(90deg, #4285f4, #34a853, #fbbc05, #ea4335, #4285f4)'
        : 'linear-gradient(90deg, #d3d3d3, #e0e0e0, #d3d3d3)',
      backgroundSize: '200% 200%',
      animation: active ? 'gradient 2.5s ease infinite' : 'none',
      transition: 'all 0.3s ease',
      boxShadow: active ? '0 0 20px rgba(66,133,244,0.4)' : 'none',
    }}
  >
    <div style={{ background: '#fff', borderRadius: 10, padding: 16, height: '100%' }}>
      {children}
    </div>
    <style jsx>{`
      @keyframes gradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
    `}</style>
  </div>
);

const AIIcon = () => (
  <span style={{ position: 'relative', display: 'inline-block' }}>
    <RobotOutlined style={{ fontSize: 16, color: '#722ed1' }} />
    <span
      style={{
        position: 'absolute',
        top: -4,
        right: -4,
        width: 6,
        height: 6,
        background: '#52c41a',
        borderRadius: '50%',
        animation: 'pulse 1.5s infinite',
      }}
    />
    <style jsx>{`
      @keyframes pulse {
        0% { transform: scale(0.8); opacity: 1; }
        100% { transform: scale(1.8); opacity: 0; }
      }
    `}</style>
  </span>
);

/* ---------- DEMO DATA (nếu chưa có trong store) ---------- */
const DEMO_COMMENTS: CardComment[] = [
  {
    id: 'c1',
    userId: 'u1',
    userName: 'Nguyễn Văn A',
    avatar: '',
    content: 'Đã hoàn thành phần UI card!',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'c2',
    userId: 'u2',
    userName: 'Trần Thị B',
    avatar: '',
    content: 'Cần thêm validation cho form',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

const DEMO_CHECKLIST: ChecklistItem[] = [
  { id: 'cl1', title: 'Thiết kế UI', done: true },
  { id: 'cl2', title: 'Kết nối API', done: true },
  { id: 'cl3', title: 'Test trên mobile', done: false },
  { id: 'cl4', title: 'Deploy', done: false },
];

const DEMO_ATTACHMENTS: Attachment[] = [
  { id: 'a1', name: 'design_mockup.png', url: '#', size: '2.4 MB', uploadedAt: new Date().toISOString() },
  { id: 'a2', name: 'api_docs.pdf', url: '#', size: '1.1 MB', uploadedAt: new Date().toISOString() },
];

/* ---------- MODAL HOÀN CHỈNH ---------- */
const CardDetailModal: React.FC<Props> = ({ cardId, isOpen, onClose }) => {
  const { cards, labels, updateCard } = projectStore();
  const card = cards[cardId] || {};

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState(card.title || '');
  const [description, setDescription] = useState(card.description || '');
  const [editingTitle, setEditingTitle] = useState(false);

  const [aiGenerating, setAIGenerating] = useState<'title' | 'description' | null>(null);
  const [aiProgress, setAIProgress] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // State mới
  const [comments, setComments] = useState<CardComment[]>(DEMO_COMMENTS);
  const [newComment, setNewComment] = useState('');
  const [checklist, setChecklist] = useState<ChecklistItem[]>(DEMO_CHECKLIST);
  const [attachments, setAttachments] = useState<Attachment[]>(DEMO_ATTACHMENTS);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  /* ---------- FETCH CARD ---------- */
  useEffect(() => {
    if (!isOpen || !cardId) return;

    const fetchCard = async () => {
      if (card.title) {
        setTitle(card.title);
        setDescription(card.description || '');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const fetched = await projectService.getCard(cardId);
        // setTitle(fetched.title);
        // setDescription(fetched.description || '');
      } catch (error) {
        message.error('Không thể tải card');
      } finally {
        setLoading(false);
      }
    };

    fetchCard();
  }, [cardId, isOpen, card]);

  /* ---------- Typewriter ---------- */
  const typeWriter = (text: string) => {
    let i = 0;
    setDisplayedText('');
    const speed = 30;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(prev => prev + text.charAt(i));
        i++;
        setAIProgress(Math.min(100, (i / text.length) * 100));
      } else {
        clearInterval(intervalRef.current!);
        setTimeout(() => {
          setAIGenerating(null);
          setAIProgress(0);
        }, 300);
      }
    }, speed);
  };

  /* ---------- AI Generate ---------- */
  const generateWithAI = async (type: 'title' | 'description') => {
    setAIGenerating(type);
    setAIProgress(0);
    await new Promise(r => setTimeout(r, 800));

    const aiContent = type === 'title'
      ? `AI: Tối ưu "${title}" thành tiêu đề chuyên nghiệp`
      : `<p><strong>AI đã tạo mô tả chi tiết:</strong></p><ul><li>Mục tiêu: Hoàn thành nhanh</li><li>Công cụ: React + Zustand</li><li>Ưu tiên: UX mượt</li></ul><p>Hiệu ứng Google AI border đang chạy!</p>`;

    typeWriter(aiContent);

    setTimeout(() => {
      if (type === 'title') {
        setTitle(aiContent);
        card && updateCard({ ...card, title: aiContent });
      } else {
        setDescription(aiContent);
        card && updateCard({ ...card, description: aiContent });
      }
    }, aiContent.length * 30 + 600);
  };

  /* ---------- Comment ---------- */
  const addComment = () => {
    if (!newComment.trim()) return;
    const comment: CardComment = {
      id: `c${Date.now()}`,
      userId: 'currentUser',
      userName: 'Bạn',
      avatar: '',
      content: newComment,
      createdAt: new Date().toISOString(),
    };
    setComments(prev => [comment, ...prev]);
    setNewComment('');
  };

  /* ---------- Checklist ---------- */
  const toggleChecklist = (id: string) => {
    setChecklist(prev => prev.map(item =>
      item.id === id ? { ...item, done: !item.done } : item
    ));
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    const item: ChecklistItem = {
      id: `cl${Date.now()}`,
      title: newChecklistItem,
      done: false,
    };
    setChecklist(prev => [...prev, item]);
    setNewChecklistItem('');
  };

  const progress = checklist.length > 0
    ? Math.round((checklist.filter(i => i.done).length / checklist.length) * 100)
    : 0;

  /* ---------- Cleanup ---------- */
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!isOpen) return null;

  if (loading) {
    return (
      <Modal open footer={null} closable={false} zIndex={1300} width={980} centered>
        <div style={{ padding: 24 }}><Skeleton active /></div>
      </Modal>
    );
  }

  if (!card && !title) return null;

  const isGeneratingTitle = aiGenerating === 'title';
  const isGeneratingDesc = aiGenerating === 'description';

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={980}
      zIndex={1300}
      centered
      destroyOnClose
      maskClosable
      closeIcon={<CloseOutlined style={{ fontSize: 18, color: '#888' }} />}
      transitionName="ant-zoom"
      maskTransitionName="ant-fade"
      styles={{
        body: { maxHeight: '88vh', overflowY: 'auto', padding: 0, background: '#f9f9fb' },
        mask: { backdropFilter: 'blur(10px)', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
      }}
    >
      <div style={{ padding: 24 }}>
        {/* TITLE */}
        <AIBorderWrapper active={isGeneratingTitle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isGeneratingTitle ? (
              <div style={{ flex: 1 }}>
                <Skeleton.Input active style={{ width: '100%', height: 32 }} />
                <Progress percent={aiProgress} size="small" showInfo={false} style={{ marginTop: 8 }} />
              </div>
            ) : editingTitle ? (
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                onBlur={() => {
                  card && updateCard({ ...card, title });
                  setEditingTitle(false);
                }}
                onPressEnter={e => e.currentTarget.blur()}
                autoFocus
                style={{ fontSize: 24, fontWeight: 'bold', border: 'none', padding: 0 }}
              />
            ) : (
              <>
                <Title level={3} style={{ margin: 0, flex: 1, cursor: 'pointer' }} onClick={() => setEditingTitle(true)}>
                  {title || 'Untitled Card'}
                </Title>
                <Button
                  icon={<AIIcon />}
                  onClick={() => generateWithAI('title')}
                  loading={isGeneratingTitle}
                  style={{
                    background: 'linear-gradient(135deg, #4285f4, #34a853)',
                    color: 'white',
                    border: 'none',
                    fontWeight: 'bold',
                  }}
                >
                  AI Title
                </Button>
              </>
            )}
          </div>
        </AIBorderWrapper>

        <div style={{ display: 'flex', gap: 24, marginTop: 20 }}>
          {/* LEFT COLUMN */}
          <div style={{ flex: 2 }}>
            {/* LABELS */}
            <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
              <div>
                <Text strong>Labels:</Text>{' '}
                <Space>
                  {card.labels?.map(l => (
                    <Tag key={l.id} color={l.color}>{l.name}</Tag>
                  ))}
                  <Button size="small" icon={<PlusOutlined />}>Add</Button>
                </Space>
              </div>

              {/* MEMBERS */}
              <div>
                <Text strong>Members:</Text>{' '}
                <Space>
                  <Avatar size="small" icon={<UserOutlined />} />
                  <Avatar size="small" style={{ backgroundColor: '#87d068' }}>A</Avatar>
                  <Avatar size="small" style={{ backgroundColor: '#f56a00' }}>B</Avatar>
                  <Button size="small" icon={<PlusOutlined />}>Add</Button>
                </Space>
              </div>
            </Space>

            <Divider style={{ margin: '16px 0' }} />

            {/* DESCRIPTION - RICH TEXT */}
            <AIBorderWrapper active={isGeneratingDesc}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <Text strong style={{ fontSize: 16 }}>Description</Text>
                  <Button
                    icon={<AIIcon />}
                    onClick={() => generateWithAI('description')}
                    loading={isGeneratingDesc}
                    style={{
                      background: 'linear-gradient(135deg, #ea4335, #fbbc05)',
                      color: 'white',
                      border: 'none',
                      fontWeight: 'bold',
                    }}
                  >
                    AI Generate
                  </Button>
                </div>

                {isGeneratingDesc ? (
                  <div>
                    <Skeleton active paragraph={{ rows: 4 }} />
                    <Progress percent={aiProgress} size="small" status="active" style={{ marginTop: 8 }} />
                  </div>
                ) : (
                  <Editor
                    apiKey="dfnxex6i2jx7ywtkpptroixrhvuz6x7voojbv17g0f6k1vad"
                    value={description}
                    onEditorChange={setDescription}
                    onBlur={() => card && updateCard({ ...card, description })}
                    init={{
                      height: 200,
                      menubar: false,
                      plugins: 'lists link',
                      toolbar: 'bold italic bullist link | undo redo',
                      content_style: 'body { font-family: Inter; font-size: 14px }',
                    }}
                  />
                )}
              </div>
            </AIBorderWrapper>

            <Divider style={{ margin: '20px 0' }} />

            {/* CHECKLIST */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <CheckSquareOutlined style={{ fontSize: 18, color: '#1890ff' }} />
                <Text strong>Checklist ({progress}%)</Text>
                <Progress percent={progress} size="small" style={{ flex: 1, maxWidth: 150 }} />
              </div>
              <Space direction="vertical" style={{ width: '100%' }}>
                {checklist.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Checkbox checked={item.done} onChange={() => toggleChecklist(item.id)} />
                    <span style={{ textDecoration: item.done ? 'line-through' : 'none', color: item.done ? '#999' : 'inherit' }}>
                      {item.title}
                    </span>
                  </div>
                ))}
                <Input
                  placeholder="Thêm công việc..."
                  value={newChecklistItem}
                  onChange={e => setNewChecklistItem(e.target.value)}
                  onPressEnter={addChecklistItem}
                  suffix={<PlusOutlined style={{ color: '#aaa' }} />}
                />
              </Space>
            </div>

            {/* ATTACHMENTS */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <PaperClipOutlined style={{ fontSize: 18, color: '#722ed1' }} />
                <Text strong>Attachments</Text>
              </div>
              <Space direction="vertical" style={{ width: '100%' }}>
                {attachments.map(file => (
                  <div key={file.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f5f5f5', borderRadius: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <PaperClipOutlined />
                      <div>
                        <Text strong>{file.name}</Text>
                        <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{file.size}</Text>
                      </div>
                    </div>
                    <Button type="link" size="small">Download</Button>
                  </div>
                ))}
                <Upload>
                  <Button icon={<PlusOutlined />}>Upload File</Button>
                </Upload>
              </Space>
            </div>
          </div>

          {/* RIGHT COLUMN - ACTIVITY */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <MessageOutlined style={{ fontSize: 18, color: '#52c41a' }} />
              <Text strong>Activity</Text>
            </div>

            {/* Add Comment */}
            <div style={{ marginBottom: 16 }}>
              <TextArea
                placeholder="Viết bình luận..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                rows={3}
                style={{ marginBottom: 8 }}
              />
              <Button type="primary" onClick={addComment} disabled={!newComment.trim()} icon={<SendOutlined />}>
                Gửi
              </Button>
            </div>
            {/* Comment List */}
            <List
              dataSource={comments}
              renderItem={item => (
                <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                  {/* THAY Comment BẰNG DIV THỦ CÔNG */}
                  <div style={{ display: 'flex', gap: 12 }}>
                    <Avatar size={36} icon={<UserOutlined />} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <Text strong style={{ fontSize: 14 }}>{item.userName}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {format(new Date(item.createdAt), 'HH:mm, dd/MM/yyyy')}
                        </Text>
                      </div>
                      <Paragraph style={{ margin: 0, color: '#333', lineHeight: 1.5 }}>
                        {item.content}
                      </Paragraph>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </div>
        </div>

        <div style={{ marginTop: 32, textAlign: 'center', color: '#888', fontSize: 12 }}>
          Google AI Border • Rich Text • Checklist • Comment • File • Realtime
        </div>
      </div>
    </Modal>
  );
};

export default CardDetailModal;