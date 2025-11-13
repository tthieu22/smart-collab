'use client';

import { RobotOutlined } from '@ant-design/icons';

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

export default AIIcon;