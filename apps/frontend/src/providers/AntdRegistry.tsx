'use client';

import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs';
import { useServerInsertedHTML } from 'next/navigation';
import React, { useEffect, useState, useMemo } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { useBoardStore } from '@smart/store/setting';

export const AntdRegistry = ({ children }: { children: React.ReactNode }) => {
  const cache = useMemo(() => createCache(), []);
  const storeTheme = useBoardStore((s) => s.theme);
  const [mode, setMode] = useState<'light' | 'dark' | null>(null);

  // Chỉ gọi hook này trên server
  if (typeof window === 'undefined') {
    useServerInsertedHTML(() => {
      const styles = extractStyle(cache, true);
      return <style id="antd" dangerouslySetInnerHTML={{ __html: styles }} />;
    });
  }

  useEffect(() => {
    let theme: 'light' | 'dark' | 'system' = storeTheme || 'system';

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (!storeTheme && (saved === 'light' || saved === 'dark' || saved === 'system')) {
        theme = saved;
      }

      const applyTheme = (t: typeof theme) => {
        if (t === 'system') {
          const media = window.matchMedia('(prefers-color-scheme: dark)');
          setMode(media.matches ? 'dark' : 'light');

          const listener = (e: MediaQueryListEvent) => setMode(e.matches ? 'dark' : 'light');
          media.addEventListener('change', listener);
          return () => media.removeEventListener('change', listener);
        } else {
          setMode(t);
        }
      };

      const cleanup = applyTheme(theme);
      return () => cleanup && cleanup();
    }
  }, [storeTheme]);

  if (!mode) return null;

  return (
    <StyleProvider cache={cache}>
      <ConfigProvider
        theme={{
          algorithm: mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: {
            borderRadius: 12,
            colorPrimary: '#1677ff',
            fontFamily: 'var(--font-inter)',
          },
          components: {
            Modal: {
              borderRadiusLG: 16,
            },
          },
        }}
      >
        {children}
      </ConfigProvider>
    </StyleProvider>
  );
};
