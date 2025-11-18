'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button, Skeleton, Progress, Typography, Input, theme, Card, Segmented, Dropdown, Popover } from 'antd';
import { Sparkles, Bold, Italic, Link, Image, List, ListOrdered, Quote, Smile, Send, Eye, Edit3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import EmojiPicker from 'emoji-picker-react'; // ← Thư viện mới, siêu ổn định
import AIBorderWrapper from './AIBorderWrapper';
import AIIcon from './AIIcon';

const { Text } = Typography;
const { TextArea } = Input;

interface Props {
  description: string;
  setDescription: (value: string) => void;
  isGenerating: boolean;
  aiProgress: number;
  onAIGenerate: (mode?: 'generate' | 'continue' | 'improve' | 'shorten') => void;
  onBlur: () => void;
}

interface LinkPreviewData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

const extractUrl = (text: string): string | null => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = text.match(urlRegex);
  return urls ? urls[0] : null;
};

const DescriptionSection: React.FC<Props> = ({
  description,
  setDescription,
  isGenerating,
  aiProgress,
  onAIGenerate,
  onBlur,
}) => {
  const { token } = theme.useToken();
  const textareaRef = useRef<any>(null);
  const [localDescription, setLocalDescription] = useState(description);
  const [viewMode, setViewMode] = useState<'write' | 'preview'>('write');
  const [showEmoji, setShowEmoji] = useState(false);
  const [previewData, setPreviewData] = useState<LinkPreviewData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [lastUrl, setLastUrl] = useState<string | null>(null);

  useEffect(() => setLocalDescription(description), [description]);

  // Auto save draft
  useEffect(() => {
    if (localDescription && localDescription !== description) {
      localStorage.setItem('draft-description', localDescription);
    }
  }, [localDescription, description]);

  // Link preview
  useEffect(() => {
    const url = extractUrl(localDescription);
    if (url && url !== lastUrl) {
      setLastUrl(url);
      fetchLinkPreview(url);
    } else if (!url && lastUrl) {
      setPreviewData(null);
      setLastUrl(null);
    }
  }, [localDescription]);

  const fetchLinkPreview = async (url: string) => {
    setLoadingPreview(true);
    try {
      const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPreviewData(data);
    } catch (err) {
      console.error('Preview error:', err);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleChange = (e: any) => setLocalDescription(e.target.value);

  const handleBlur = () => {
    if (localDescription !== description) {
      setDescription(localDescription);
      localStorage.removeItem('draft-description');
    }
    onBlur();
  };

  const insertMarkdown = (before: string, after: string = before) => {
    const textarea = textareaRef.current?.resizableTextArea?.textArea;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = localDescription.substring(start, end) || 'text';
    const newText = localDescription.slice(0, start) + before + selected + after + localDescription.slice(end);
    setLocalDescription(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 0);
  };

  const onEmojiClick = (emojiData: any) => {
    setLocalDescription(prev => prev + emojiData.emoji);
    setShowEmoji(false);
  };

  const aiMenu = {
    items: [
      { key: 'generate', label: 'Generate from scratch', icon: <Sparkles className="w-4 h-4" /> },
      { key: 'continue', label: 'Continue writing', icon: <Send className="w-4 h-4" /> },
      { key: 'improve', label: 'Improve writing', icon: <Edit3 className="w-4 h-4" /> },
      { key: 'shorten', label: 'Make shorter', icon: <Bold className="w-4 h-4" /> },
    ],
    onClick: ({ key }: any) => onAIGenerate(key as any),
  };

  const charCount = localDescription.length;

  return (
    <AIBorderWrapper active={isGenerating}>
      <div style={{
        backgroundColor: token.colorBgContainer,
        borderRadius: token.borderRadiusLG,
        boxShadow: token.boxShadowSecondary,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${token.colorBorder}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text strong style={{ fontSize: 16 }}>Description</Text>
            <Dropdown menu={aiMenu} trigger={['click']}>
              <Button
                icon={<AIIcon />}
                loading={isGenerating}
                style={{
                  background: 'linear-gradient(135deg, #ea4335, #fbbc05)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 'bold',
                }}
              >
                AI Magic <Sparkles className="ml-1 w-4 h-4" />
              </Button>
            </Dropdown>
          </div>
        </div>

        {/* Toolbar */}
        {viewMode === 'write' && !isGenerating && (
          <div style={{ padding: '8px 16px', borderBottom: `1px solid ${token.colorBorder}`, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Button size="small" icon={<Bold className="w-4 h-4" />} onClick={() => insertMarkdown('**', '**')} />
            <Button size="small" icon={<Italic className="w-4 h-4" />} onClick={() => insertMarkdown('*', '*')} />
            <Button size="small" icon={<Link className="w-4 h-4" />} onClick={() => insertMarkdown('[', '](url)')} />
            <Button size="small" icon={<Image className="w-4 h-4" />} onClick={() => insertMarkdown('![alt](', ')')} />
            <Button size="small" icon={<List className="w-4 h-4" />} onClick={() => insertMarkdown('- ')} />
            <Button size="small" icon={<ListOrdered className="w-4 h-4" />} onClick={() => insertMarkdown('1. ')} />
            <Button size="small" icon={<Quote className="w-4 h-4" />} onClick={() => insertMarkdown('> ')} />
            <Popover
              content={<EmojiPicker onEmojiClick={onEmojiClick} width={320} height={400} />}
              trigger="click"
              open={showEmoji}
              onOpenChange={setShowEmoji}
              placement="topRight"
            >
              <Button size="small" icon={<Smile className="w-4 h-4" />} />
            </Popover>
          </div>
        )}

        {/* Tab Write / Preview */}
        <div style={{ padding: '8px 16px 0' }}>
          <Segmented
            options={[
              { label: 'Write', value: 'write', icon: <Edit3 className="w-4 h-4" /> },
              { label: 'Preview', value: 'preview', icon: <Eye className="w-4 h-4" /> },
            ]}
            value={viewMode}
            onChange={(v) => setViewMode(v as any)}
          />
        </div>

        {/* Content */}
        <div style={{ padding: 16, position: 'relative' }}>
          {isGenerating ? (
            <>
              <Skeleton active paragraph={{ rows: 6 }} />
              <Progress percent={aiProgress} size="small" status="active" strokeColor={{ '0%': '#ea4335', '100%': '#fbbc05' }} style={{ marginTop: 12 }} />
            </>
          ) : viewMode === 'preview' ? (
            <div className="prose prose-sm max-w-none" style={{ minHeight: 200 }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {localDescription || '*Chưa có nội dung để xem trước...*'}
              </ReactMarkdown>
            </div>
          ) : (
            <>
              <TextArea
                ref={textareaRef}
                value={localDescription}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Viết mô tả thật chất tại đây... hỗ trợ Markdown, link preview, emoji, hình ảnh..."
                rows={10}
                style={{ resize: 'none', fontSize: 14, lineHeight: 1.6 }}
              />

              {/* AI Continue */}
              {localDescription.endsWith('\n\n') && !isGenerating && (
                <Button size="small" type="primary" ghost style={{ position: 'absolute', right: 20, bottom: 80 }}
                  onClick={() => onAIGenerate('continue')}>
                  <Sparkles className="w-4 h-4 mr-1" /> AI tiếp tục viết...
                </Button>
              )}

              {/* Link Preview */}
              {loadingPreview && <Text type="secondary">Đang tải preview...</Text>}
              {previewData && !loadingPreview && (
                <Card hoverable style={{ marginTop: 16, maxWidth: 420 }}
                  cover={previewData.image ? <img alt="" src={previewData.image} style={{ height: 180, objectFit: 'cover' }} /> : null}
                  onClick={() => previewData.url && window.open(previewData.url, '_blank')}
                >
                  <Card.Meta title={previewData.title} description={previewData.description} />
                </Card>
              )}

              <div style={{ textAlign: 'right', marginTop: 8 }}>
                <Text type={charCount > 10000 ? 'danger' : 'secondary'}>
                  {charCount.toLocaleString()} ký tự
                </Text>
              </div>
            </>
          )}
        </div>
      </div>
    </AIBorderWrapper>
  );
};

export default DescriptionSection;