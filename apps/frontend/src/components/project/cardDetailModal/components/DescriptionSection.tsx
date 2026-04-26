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

// 👉 decode HTML entity (không cần lib)
const decodeHTML = (html: string) => {
  if (!html) return '';
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

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
  const isDark = token.colorBgContainer === '#141414';

  const [localDescription, setLocalDescription] = React.useState(description);

  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

  // Sync từ BE nhưng không overwrite khi đang gõ
  React.useEffect(() => {
    if (description !== localDescription) {
      setLocalDescription(description);
    }
  }, [description]);

  // cleanup
  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleChange = (value: string) => {
    setLocalDescription(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      const decoded = decodeHTML(value); // 🔥 fix encode tại đây

      if (decoded !== description) {
        setDescription(decoded);
        onBlur(decoded); // gửi BE
      }
    }, 800);
  };

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
    <AIBorderWrapper active={isGenerating} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
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

        <div style={{ flex: 1 }}>
          {isGenerating ? (
            <>
              <Skeleton active paragraph={{ rows: 10 }} />
              <Progress percent={aiProgress} style={{ marginTop: 16 }} />
            </>
          ) : (
            <div onKeyDown={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
              <MDXEditor
                markdown={localDescription || ''}
                onChange={handleChange}
                placeholder="Viết nội dung kiểu Zalo, hỗ trợ markdown, paste list, emoji..."
                className={isDark ? 'dark-theme' : ''}
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
                contentEditableClassName="prose prose-sm max-w-none focus:outline-none min-h-[300px] pt-2 dark:prose-invert"
              />
            </div>
          )}
        </div>
      </div>
    </AIBorderWrapper>
  );
};

export default DescriptionSection;