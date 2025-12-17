'use client';

import React from 'react';
import {
  Button,
  Skeleton,
  Progress,
  Typography,
  theme,
  Dropdown,
  Card,
} from 'antd';
import { Sparkles } from 'lucide-react';

// Import chính và các plugin cần thiết
import { MDXEditor } from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';

import {
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  linkPlugin,
  linkDialogPlugin,
  tablePlugin,
  codeBlockPlugin,
  codeMirrorPlugin,
} from '@mdxeditor/editor';

import AIBorderWrapper from './AIBorderWrapper';
import AIIcon from './AIIcon';

const { Text } = Typography;

interface Props {
  description: string;
  setDescription: (value: string) => void;
  isGenerating: boolean;
  aiProgress: number;
  onAIGenerate: (
    mode?: 'generate' | 'continue' | 'improve' | 'shorten'
  ) => void;
  onBlur: (updatedDescription: string) => void;
}

const DescriptionSection: React.FC<Props> = ({
  description,
  setDescription,
  isGenerating,
  aiProgress,
  onAIGenerate,
  onBlur,
}) => {
  const { token } = theme.useToken();
  const isDark = token.colorBgContainer === '#141414'; // AntD dark mode có bg container là #141414

  const aiMenu = {
    items: [
      { key: 'generate', label: 'Generate from scratch' },
      { key: 'continue', label: 'Continue writing' },
      { key: 'improve', label: 'Improve writing' },
      { key: 'shorten', label: 'Make shorter' },
    ],
    onClick: ({ key }: any) => onAIGenerate(key as any),
  };

  return (
    <AIBorderWrapper active={isGenerating}>
      {/* Dùng Card của AntD thay vì div custom để tự động theo theme sáng/tối */}
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text strong>Description</Text>
            <Dropdown menu={aiMenu}>
              <Button
                icon={<AIIcon />}
                loading={isGenerating}
                style={{
                  background: 'linear-gradient(135deg,#ea4335,#fbbc05)',
                  color: '#fff',
                  border: 'none',
                }}
              >
                AI Magic <Sparkles className="w-4 h-4 ml-1" />
              </Button>
            </Dropdown>
          </div>
        }
        bordered={false}
        bodyStyle={{ padding: 16 }}
        headStyle={{ padding: '12px 16px' }}
      >
        {isGenerating ? (
          <>
            <Skeleton active paragraph={{ rows: 10 }} />
            <Progress percent={aiProgress} style={{ marginTop: 16 }} />
          </>
        ) : (
          <MDXEditor
            markdown={description || ''}
            onChange={(value) => {
              setDescription(value);
              onBlur(value);
            }}
            placeholder="Viết nội dung kiểu Zalo, hỗ trợ markdown, paste list, emoji..."
            className={isDark ? 'dark-theme' : ''} // Kích hoạt dark mode built-in của MDXEditor
            plugins={[
              headingsPlugin(),
              listsPlugin(),
              quotePlugin(),
              thematicBreakPlugin(),
              markdownShortcutPlugin(),
              linkPlugin(),
              linkDialogPlugin(),
              tablePlugin(),
              codeBlockPlugin(),
              codeMirrorPlugin(),
            ]}
            // Dùng Tailwind prose + dark:prose-invert để nội dung markdown đẹp và hỗ trợ dark mode hoàn hảo
            contentEditableClassName="prose prose-sm max-w-none focus:outline-none min-h-96 pt-2 dark:prose-invert"
          />
        )}
      </Card>
    </AIBorderWrapper>
  );
};

export default DescriptionSection;