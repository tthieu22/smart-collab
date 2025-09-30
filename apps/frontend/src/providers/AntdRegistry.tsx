'use client';

import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs';
import { useServerInsertedHTML } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { useTheme } from 'next-themes';

export const AntdRegistry = ({ children }: { children: React.ReactNode }) => {
  const cache = React.useMemo(() => createCache(), []);
  const { theme } = useTheme(); // light | dark | system
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  // sync với next-themes
  useEffect(() => {
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      setMode(mq.matches ? 'dark' : 'light');
      const listener = (e: MediaQueryListEvent) =>
        setMode(e.matches ? 'dark' : 'light');
      mq.addEventListener('change', listener);
      return () => mq.removeEventListener('change', listener);
    } else if (theme === 'dark') {
      setMode('dark');
    } else {
      setMode('light');
    }
  }, [theme]);

  useServerInsertedHTML(() => {
    const styles = extractStyle(cache, true);
    return <style id="antd" dangerouslySetInnerHTML={{ __html: styles }} />;
  });

  return (
    <StyleProvider cache={cache}>
      <ConfigProvider
        theme={{
          algorithm:
            mode === 'dark'
              ? antdTheme.darkAlgorithm
              : antdTheme.defaultAlgorithm,
        }}
      >
        {children}
      </ConfigProvider>
    </StyleProvider>
  );
};
