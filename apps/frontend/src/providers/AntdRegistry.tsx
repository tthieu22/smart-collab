'use client';
import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs';
import { useServerInsertedHTML } from 'next/navigation';
import React from 'react';

export const AntdRegistry = ({ children }: { children: React.ReactNode }) => {
  const cache = React.useMemo(() => createCache(), []);

  useServerInsertedHTML(() => {
    const styles = extractStyle(cache, true);
    return <style id="antd" dangerouslySetInnerHTML={{ __html: styles }} />;
  });

  return <StyleProvider cache={cache}>{children}</StyleProvider>;
};
