'use client';

import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs';
import { useServerInsertedHTML } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { useBoardStore } from '@smart/store/board'; // store theme

export const AntdRegistry = ({ children }: { children: React.ReactNode }) => {
  const cache = React.useMemo(() => createCache(), []);
  const themeFromStore = useBoardStore((s) => s.theme); // light | dark | system
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  // sync mode với store
  useEffect(() => {
    if (themeFromStore === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      setMode(mq.matches ? 'dark' : 'light');
      const listener = (e: MediaQueryListEvent) => setMode(e.matches ? 'dark' : 'light');
      mq.addEventListener('change', listener);
      return () => mq.removeEventListener('change', listener);
    } else if (themeFromStore === 'dark') {
      setMode('dark');
    } else {
      setMode('light');
    }
  }, [themeFromStore]);

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
