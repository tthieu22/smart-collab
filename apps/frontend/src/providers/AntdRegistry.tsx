'use client';

import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs';
import { useServerInsertedHTML } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { useBoardStore } from '@smart/store/board'; // store theme

export const AntdRegistry = ({ children }: { children: React.ReactNode }) => {
  const cache = React.useMemo(() => createCache(), []);
  const storeTheme = useBoardStore((s) => s.theme);
  const [mode, setMode] = useState<'light' | 'dark' | null>(null); // null = chưa xác định

  // Lấy theme từ localStorage nếu có, ưu tiên store > localStorage > system
  useEffect(() => {
    let theme: 'light' | 'dark' | 'system' = storeTheme;

    if (!theme && typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        theme = saved;
      } else {
        theme = 'system';
      }
    }

    const applyTheme = (t: typeof theme) => {
      if (t === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setMode(prefersDark ? 'dark' : 'light');

        const listener = (e: MediaQueryListEvent) => setMode(e.matches ? 'dark' : 'light');
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', listener);
        return () =>
          window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', listener);
      } else {
        setMode(t);
      }
    };

    const cleanup = applyTheme(theme);

    return () => {
      if (cleanup) cleanup();
    };
  }, [storeTheme]);

  // Chặn render trước khi mode xác định xong
  if (!mode) return null;

  useServerInsertedHTML(() => {
    const styles = extractStyle(cache, true);
    return <style id="antd" dangerouslySetInnerHTML={{ __html: styles }} />;
  });

  return (
    <StyleProvider cache={cache}>
      <ConfigProvider
        theme={{
          algorithm: mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        }}
      >
        {children}
      </ConfigProvider>
    </StyleProvider>
  );
};
