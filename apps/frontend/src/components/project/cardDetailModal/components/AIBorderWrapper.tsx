import React from 'react';
import { theme } from 'antd';

const AIBorderWrapper: React.FC<{ children: React.ReactNode; active?: boolean; style?: React.CSSProperties }> = ({
  children,
  active,
  style,
}) => {
  const { token } = theme.useToken();

  return (
    <>
      <div className={active ? 'active' : 'inactive'} style={style}>
        <div className="content">{children}</div>
      </div>
      <style jsx>{`
        div {
          position: relative;
          border-radius: 24px;
          padding: 1px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          height: 100%;
        }
        .active {
          padding: 2px;
          background-image: linear-gradient(
            90deg,
            ${token.colorPrimary},
            ${token.colorSuccess},
            ${token.colorWarning},
            ${token.colorError},
            ${token.colorPrimary}
          );
          background-repeat: no-repeat;
          background-position: 0% 50%;
          background-size: 200% 200%;
          animation: gradient 2.5s ease infinite;
          box-shadow: 0 0 30px ${token.colorPrimary}44;
        }
        .inactive {
          background-color: ${(token as any).mode === 'dark' ? '#222' : token.colorBorderSecondary};
        }
        div.inactive:hover {
          background-color: ${token.colorPrimary}66;
          box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.3);
        }
        .content {
          background: ${(token as any).mode === 'dark' ? '#0a0a0a' : token.colorBgElevated};
          border-radius: 23px;
          padding: 24px;
          height: 100%;
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </>
  );
};

export default AIBorderWrapper;
