'use client';

import React from 'react';
import { theme } from 'antd';

const AIBorderWrapper: React.FC<{ children: React.ReactNode; active?: boolean }> = ({
  children,
  active,
}) => {
  const { token } = theme.useToken();

  // gradient màu dựa trên theme, bạn có thể chỉnh theo ý thích
  const activeGradient = `linear-gradient(
    90deg, 
    ${token.colorPrimary}, 
    ${token.colorSuccess}, 
    ${token.colorWarning}, 
    ${token.colorError}, 
    ${token.colorPrimary}
  )`;
  const inactiveGradient = `linear-gradient(
    90deg, 
    ${token.colorBorderSecondary}, 
    ${token.colorBorder}, 
    ${token.colorBorderSecondary}
  )`;

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 12,
        padding: active ? 3 : 2,
        background: active ? activeGradient : inactiveGradient,
        backgroundSize: '200% 200%',
        animation: active ? 'gradient 2.5s ease infinite' : 'none',
        transition: 'all 0.3s ease',
        boxShadow: active ? `0 0 20px ${token.colorPrimary}66` : 'none', // 66 = 40% opacity
      }}
    >
      <div
        style={{
          background: token.colorBgContainer, // màu nền container theo theme
          borderRadius: 10,
          padding: 16,
          height: '100%',
        }}
      >
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
};

export default AIBorderWrapper;
